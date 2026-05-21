export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { amount, customer_phone, customer_email, customer_name } = req.body;
  const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-api-version': '2023-08-01',
      'x-client-id': process.env.VITE_CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET_KEY
    },
    body: JSON.stringify({
      order_amount: amount,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: `CUST_${Date.now()}`,
        customer_phone: customer_phone,
        customer_email: customer_email,
        customer_name: customer_name
      },
      order_meta: {
        return_url: `https://projectdukaan.com/payment-status?order_id=${orderId}`
      }
    })
  };

  try {
    const response = await fetch('https://sandbox.cashfree.com/pg/orders', options);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ message: data.message || 'Payment API Error', details: data });
    }

    res.status(200).json({ payment_session_id: data.payment_session_id, order_id: orderId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
