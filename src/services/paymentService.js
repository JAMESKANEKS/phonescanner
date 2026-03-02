import { db } from '../firebase/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

const PAYMENT_REQUESTS_COLLECTION = 'paymentRequests';

export const paymentService = {
  // Submit a new payment request
  async submitPaymentRequest(paymentData) {
    try {
      console.log('Submitting payment request:', paymentData);
      console.log('Database instance:', db);
      console.log('Collection name:', PAYMENT_REQUESTS_COLLECTION);
      
      const requestData = {
        userId: paymentData.userId,
        userEmail: paymentData.userEmail,
        userName: paymentData.userName || paymentData.userEmail,
        reference: paymentData.reference,
        amount: paymentData.amount || 49,
        currency: paymentData.currency || 'PHP',
        type: paymentData.type || 'monthly_subscription',
        status: 'pending',
        submittedAt: Timestamp.now(),
        approvedAt: null,
        approvedBy: null,
        notes: paymentData.notes || ''
      };

      console.log('Request data to save:', requestData);
      
      const docRef = await addDoc(collection(db, PAYMENT_REQUESTS_COLLECTION), requestData);
      console.log('Document created with ID:', docRef.id);
      console.log('Document path:', docRef.path);
      
      return { id: docRef.id, ...requestData };
    } catch (error) {
      console.error('Error submitting payment request:', error);
      console.error('Error details:', error.code, error.message);
      throw error;
    }
  },

  // Get all payment requests (for admin)
  async getAllPaymentRequests() {
    try {
      const q = query(
        collection(db, PAYMENT_REQUESTS_COLLECTION),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      throw error;
    }
  },

  // Get payment requests for a specific user
  async getUserPaymentRequests(userId) {
    try {
      const q = query(
        collection(db, PAYMENT_REQUESTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching user payment requests:', error);
      throw error;
    }
  },

  // Approve a payment request
  async approvePaymentRequest(requestId, adminId, adminEmail) {
    try {
      const requestRef = doc(db, PAYMENT_REQUESTS_COLLECTION, requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: Timestamp.now(),
        approvedBy: adminId,
        approvedByEmail: adminEmail
      });
      return { requestId, status: 'approved' };
    } catch (error) {
      console.error('Error approving payment request:', error);
      throw error;
    }
  },

  // Reject a payment request
  async rejectPaymentRequest(requestId, adminId, adminEmail, reason) {
    try {
      const requestRef = doc(db, PAYMENT_REQUESTS_COLLECTION, requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        approvedAt: Timestamp.now(),
        approvedBy: adminId,
        approvedByEmail: adminEmail,
        rejectionReason: reason
      });
      return { requestId, status: 'rejected' };
    } catch (error) {
      console.error('Error rejecting payment request:', error);
      throw error;
    }
  },

  // Delete a payment request
  async deletePaymentRequest(requestId) {
    try {
      await deleteDoc(doc(db, PAYMENT_REQUESTS_COLLECTION, requestId));
      return { requestId, deleted: true };
    } catch (error) {
      console.error('Error deleting payment request:', error);
      throw error;
    }
  },

  // Check if user has any approved payment requests
  async hasApprovedPayment(userId) {
    try {
      const q = query(
        collection(db, PAYMENT_REQUESTS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'approved')
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking approved payment:', error);
      return false;
    }
  }
};
