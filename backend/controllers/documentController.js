const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getDocumentsByPatientId(req, res) {
  try {
    const { patientId } = req.params;
    const docs = mockStore.medical_documents.filter(d => d.patient_id === patientId);
    return sendSuccess(res, docs);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function uploadDocument(req, res) {
  try {
    const { patient_id, document_name, document_type } = req.body;
    if (!patient_id || !document_name) {
      return sendError(res, 'patient_id and document_name are required', 400);
    }

    const newDoc = {
      document_id: `doc-${Date.now()}`,
      patient_id,
      uploaded_by: req.user.id,
      document_name,
      document_type: document_type || 'application/pdf',
      storage_path: `patients/${patient_id}/${document_name}`,
      file_size: 154200,
      uploaded_at: new Date()
    };

    mockStore.medical_documents.push(newDoc);
    return sendSuccess(res, newDoc, 'Document uploaded successfully', 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function getDownloadUrl(req, res) {
  try {
    const { id } = req.params;
    const doc = mockStore.medical_documents.find(d => d.document_id === id);
    if (!doc) return sendError(res, 'Document not found', 404);

    // Provide signed download url representation
    const signedUrl = `https://mock-storage.careloop.local/signed/${doc.document_id}?expires=3600`;
    return sendSuccess(res, {
      ...doc,
      download_url: signedUrl,
      expires_in_seconds: 3600
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    mockStore.medical_documents = mockStore.medical_documents.filter(d => d.document_id !== id);
    return sendSuccess(res, null, 'Document deleted successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  getDocumentsByPatientId,
  uploadDocument,
  getDownloadUrl,
  deleteDocument
};
