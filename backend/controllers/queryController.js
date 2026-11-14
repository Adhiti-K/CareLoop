const mockStore = require('../database/mockStore');
const { sendSuccess, sendError } = require('../utils/responseHandler');

async function getAllQueries(req, res) {
  try {
    const user = req.user;
    let list = mockStore.patient_queries;

    if (user.role === 'patient') {
      const pat = mockStore.patients.find(p => p.user_id === user.id);
      list = pat ? list.filter(q => q.patient_id === pat.patient_id) : [];
    }

    const enriched = list.map(q => {
      const pat = mockStore.patients.find(p => p.patient_id === q.patient_id) || {};
      const patProf = mockStore.profiles.find(u => u.id === pat.user_id) || {};
      return {
        ...q,
        patient_name: patProf.full_name || 'Patient',
        recovery_id: pat.recovery_id || 'N/A'
      };
    });

    return sendSuccess(res, enriched);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function getQueryById(req, res) {
  try {
    const { id } = req.params;
    const query = mockStore.patient_queries.find(q => q.query_id === id);
    if (!query) return sendError(res, 'Query not found', 404);

    const history = mockStore.query_history.filter(qh => qh.query_id === id);
    return sendSuccess(res, { ...query, history });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function createQuery(req, res) {
  try {
    const { category, description } = req.body;
    if (!category || !description) {
      return sendError(res, 'Category and description are required', 400);
    }

    let patientId = req.body.patient_id;
    if (req.user.role === 'patient') {
      const pat = mockStore.patients.find(p => p.user_id === req.user.id);
      if (pat) patientId = pat.patient_id;
    }

    if (!patientId) {
      patientId = 'pat-1';
    }

    const newQuery = {
      query_id: `qry-${Date.now()}`,
      patient_id: patientId,
      assigned_to: 'mock-doctor-uuid',
      category,
      description,
      response: null,
      status: 'Open',
      created_at: new Date(),
      updated_at: new Date()
    };

    mockStore.patient_queries.push(newQuery);

    return sendSuccess(res, newQuery, 'Query submitted successfully', 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function updateQuery(req, res) {
  try {
    const { id } = req.params;
    const idx = mockStore.patient_queries.findIndex(q => q.query_id === id);
    if (idx === -1) return sendError(res, 'Query not found', 404);

    const prev = mockStore.patient_queries[idx];
    mockStore.patient_queries[idx] = {
      ...prev,
      ...req.body,
      updated_at: new Date()
    };

    return sendSuccess(res, mockStore.patient_queries[idx], 'Query updated');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

async function resolveQuery(req, res) {
  try {
    const { id } = req.params;
    const { response } = req.body;
    if (!response) return sendError(res, 'Response text is required to resolve query', 400);

    const query = mockStore.patient_queries.find(q => q.query_id === id);
    if (!query) return sendError(res, 'Query not found', 404);

    const previousStatus = query.status;
    query.status = 'Resolved';
    query.response = response;
    query.assigned_to = req.user.id;
    query.updated_at = new Date();

    // Log in history
    mockStore.query_history.push({
      history_id: `qhist-${Date.now()}`,
      query_id: id,
      updated_by: req.user.id,
      previous_status: previousStatus,
      new_status: 'Resolved',
      response,
      created_at: new Date()
    });

    // Notify patient
    const patient = mockStore.patients.find(p => p.patient_id === query.patient_id);
    if (patient) {
      mockStore.notifications.push({
        notification_id: `notif-${Date.now()}`,
        user_id: patient.user_id,
        title: 'Doctor Responded to Your Query',
        message: `Your query regarding "${query.category}" has been addressed.`,
        notification_type: 'query_response',
        related_entity_id: query.query_id,
        is_read: false,
        created_at: new Date()
      });
    }

    return sendSuccess(res, query, 'Query resolved and response recorded');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
}

module.exports = {
  getAllQueries,
  getQueryById,
  createQuery,
  updateQuery,
  resolveQuery
};
