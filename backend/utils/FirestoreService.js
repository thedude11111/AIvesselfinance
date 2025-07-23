const admin = require('firebase-admin');

/**
 * Firestore Database Service
 * Handles users and analyses collections as specified in the plan
 */
class FirestoreService {
  constructor() {
    try {
      if (!admin.apps.length) {
        const config = {
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT
        };
        
        // Use service account credentials if provided
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
          config.credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
          });
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          config.credential = admin.credential.cert(serviceAccount);
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          config.credential = admin.credential.applicationDefault();
        }
        
        admin.initializeApp(config);
      }
      
      this.db = admin.firestore();
      
      // Set up Firestore settings for better performance
      this.db.settings({
        ignoreUndefinedProperties: true
      });
      
      console.log('✅ Firestore initialized successfully');
    } catch (error) {
      console.error('❌ Firestore initialization error:', error);
      console.log('💡 Note: Make sure Firestore is enabled in Firebase Console');
      this.db = null; // Set to null so we can handle gracefully
    }
  }

  async createUser(userId, userData) {
    try {
      if (!this.db) {
        console.log('⚠️ Firestore not available, skipping user creation');
        return { userId, ...userData };
      }

      const userRef = this.db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      const userDataToSave = {
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL || null,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!userDoc.exists) {
        // Create new user
        userDataToSave.createdAt = admin.firestore.FieldValue.serverTimestamp();
        await userRef.set(userDataToSave);
      } else {
        // Update existing user
        await userRef.update(userDataToSave);
      }
      
      return { userId, ...userData };
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw new Error(`User operation failed: ${error.message}`);
    }
  }

  async getUser(userId) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return null;
      }
      
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error(`Get user failed: ${error.message}`);
    }
  }

  async saveAnalysis(analysisData) {
    try {
      const { userId, analysisName, parameters, results } = analysisData;
      
      // Validate required fields
      if (!userId || !parameters || !results) {
        throw new Error('Missing required fields: userId, parameters, and results are required');
      }

      const analysisDoc = {
        userId,
        analysisName: analysisName || 'Vessel Analysis',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        parameters: this.sanitizeData(parameters),
        results: this.sanitizeData(results),
        version: 1
      };

      const docRef = await this.db.collection('analyses').add(analysisDoc);
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw new Error(`Save analysis failed: ${error.message}`);
    }
  }

  async getAnalysis(analysisId, userId) {
    try {
      const analysisDoc = await this.db.collection('analyses').doc(analysisId).get();
      
      if (!analysisDoc.exists) {
        return null;
      }
      
      const data = analysisDoc.data();
      
      // Verify ownership
      if (data.userId !== userId) {
        throw new Error('Access denied: Analysis belongs to different user');
      }
      
      return {
        id: analysisDoc.id,
        ...data
      };
    } catch (error) {
      console.error('Error getting analysis:', error);
      throw new Error(`Get analysis failed: ${error.message}`);
    }
  }

  async getUserAnalyses(userId, limit = 50) {
    try {
      if (!this.db) {
        console.log('⚠️ Firestore not available, returning empty analyses');
        return [];
      }

      let query = this.db.collection('analyses')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          analysisName: data.analysisName,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          // Include summary information but not full results for performance
          summary: {
            vesselType: data.parameters?.vesselType,
            price: data.parameters?.price,
            npv: data.results?.npv,
            irr: data.results?.irr
          }
        };
      });
    } catch (error) {
      console.error('Error getting user analyses:', error);
      if (error.code === 5) {
        console.log('💡 Firestore database not found. Please enable Firestore in Firebase Console.');
        return []; // Return empty array instead of throwing
      }
      throw new Error(`Get user analyses failed: ${error.message}`);
    }
  }

  async updateAnalysis(analysisId, userId, updateData) {
    try {
      const analysisRef = this.db.collection('analyses').doc(analysisId);
      const analysisDoc = await analysisRef.get();
      
      if (!analysisDoc.exists) {
        throw new Error('Analysis not found');
      }
      
      const data = analysisDoc.data();
      
      // Verify ownership
      if (data.userId !== userId) {
        throw new Error('Access denied: Analysis belongs to different user');
      }
      
      const sanitizedUpdateData = this.sanitizeData(updateData);
      sanitizedUpdateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      
      await analysisRef.update(sanitizedUpdateData);
      
      return true;
    } catch (error) {
      console.error('Error updating analysis:', error);
      throw new Error(`Update analysis failed: ${error.message}`);
    }
  }

  async deleteAnalysis(analysisId, userId) {
    try {
      const analysisRef = this.db.collection('analyses').doc(analysisId);
      const analysisDoc = await analysisRef.get();
      
      if (!analysisDoc.exists) {
        return false; // Already doesn't exist
      }
      
      const data = analysisDoc.data();
      
      // Verify ownership
      if (data.userId !== userId) {
        throw new Error('Access denied: Analysis belongs to different user');
      }
      
      await analysisRef.delete();
      
      return true;
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw new Error(`Delete analysis failed: ${error.message}`);
    }
  }

  async getUserAnalysesCount(userId) {
    try {
      const snapshot = await this.db.collection('analyses')
        .where('userId', '==', userId)
        .count()
        .get();
      
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting user analyses count:', error);
      throw new Error(`Get analyses count failed: ${error.message}`);
    }
  }

  async searchAnalyses(userId, searchTerm, limit = 20) {
    try {
      // Simple search by analysis name
      const snapshot = await this.db.collection('analyses')
        .where('userId', '==', userId)
        .where('analysisName', '>=', searchTerm)
        .where('analysisName', '<=', searchTerm + '\uf8ff')
        .orderBy('analysisName')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error searching analyses:', error);
      throw new Error(`Search analyses failed: ${error.message}`);
    }
  }

  // Utility method to sanitize data before saving to Firestore
  sanitizeData(data) {
    if (data === null || data === undefined) {
      return null;
    }
    
    if (typeof data !== 'object') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip undefined values and functions
      if (value === undefined || typeof value === 'function') {
        continue;
      }
      
      // Handle NaN and Infinity
      if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) {
          sanitized[key] = null;
          continue;
        }
      }
      
      // Recursively sanitize objects
      sanitized[key] = this.sanitizeData(value);
    }
    
    return sanitized;
  }

  // Cleanup old analyses (can be used for maintenance)
  async cleanupOldAnalyses(daysOld = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const snapshot = await this.db.collection('analyses')
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
        .limit(100) // Process in batches
        .get();
      
      const batch = this.db.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      return snapshot.size;
    } catch (error) {
      console.error('Error cleaning up old analyses:', error);
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }
}

module.exports = FirestoreService;