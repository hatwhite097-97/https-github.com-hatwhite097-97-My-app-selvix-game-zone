// Appwrite Function: SpeedPesa Payment Integration Gateway
// This function handles secure payment processing server-side on Appwrite.

const sdk = require('node-appwrite');
const axios = require('axios'); // for making HTTP requests to SpeedPesa
const { Query } = sdk;

module.exports = async function (context) {
  const client = new sdk.Client();
  
  // Configure client from Appwrite environmental variables
  if (context.req.headers['x-appwrite-trigger'] === 'http') {
    client
      .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(context.req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY);
  }

  const payload = context.req.body ? JSON.parse(context.req.body) : {};
  const action = payload.action; // e.g., 'REQUEST_PAYMENT', 'CHECK_STATUS', 'CHECK_BALANCE', 'DISBURSEMENT'
  const apiKey = process.env.SPEEDPESA_API_KEY;
  
  const databases = new sdk.Databases(client);
  const dbId = process.env.APPWRITE_DATABASE_ID || 'selvix_db';
  const txCollectionId = process.env.APPWRITE_TX_COLLECTION_ID || 'transactions';

  try {
    switch (action) {
      case 'REQUEST_PAYMENT':
        // 1. Mobile Payin Collection API Integration
        const payinResponse = await axios.post('https://api.speedpesa.com/v1/payments/request', {
          phonenumber: payload.phonenumber, // Format: 255750020767
          amount: payload.amount.toString(),
          reference: 'TX-' + Date.now()
        }, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return context.res.json({ success: true, message: "Malipo yameombwa", data: payinResponse.data });

      case 'CHECK_STATUS':
        // 2. Transaction Status Check API Integration
        const statusResponse = await axios.get(`https://api.speedpesa.com/v1/payments/status/${payload.reference}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        const currentStatus = statusResponse.data.status;
        
        // Update Appwrite Database if payment was successful
        if (currentStatus === 'SUCCESS') {
          try {
            const txs = await databases.listDocuments(dbId, txCollectionId, [
              Query.equal('reference', payload.reference)
            ]);
            if (txs.total > 0) {
              const txDoc = txs.documents[0];
              if (txDoc.status !== 'SUCCESS') {
                await databases.updateDocument(dbId, txCollectionId, txDoc.$id, {
                  status: 'SUCCESS'
                });
              }
            }
          } catch (dbErr) {
            context.error('Database update failed: ' + dbErr.message);
          }
        }
        
        return context.res.json({ success: true, status: currentStatus });

      case 'DISBURSEMENT':
        // 3. Mobile Payout/Disbursement API Integration (e.g. for User Withdrawals)
        const payoutResponse = await axios.post('https://api.speedpesa.com/v1/disbursements/withdraw', {
          phonenumber: payload.phonenumber,
          amount: payload.amount.toString(),
          reference: 'WD-' + Date.now()
        }, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return context.res.json({ success: true, message: "Kutoa fedha kumeshughulikiwa", data: payoutResponse.data });

      case 'CHECK_BALANCE':
        // 4. Live Merchant Account Balance Check API Integration
        const balanceResponse = await axios.get('https://api.speedpesa.com/v1/merchant/balance', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return context.res.json({ success: true, balance: balanceResponse.data.balance });

      default:
        return context.res.json({ success: false, message: "Action haitambuliki" }, 400);
    }
  } catch (error) {
    context.error('Error executing SpeedPesa API request: ' + error.message);
    return context.res.json({ success: false, message: error.message }, 500);
  }
};
