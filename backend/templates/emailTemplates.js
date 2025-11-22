const emailTemplates = {
  // Base template wrapper
  baseTemplate: (content) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .button:hover { background: #5568d3; }
        .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-item { border-bottom: 1px solid #e0e0e0; padding: 15px 0; }
        .order-item:last-child { border-bottom: none; }
        .total { font-size: 20px; font-weight: bold; color: #667eea; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .footer a { color: #667eea; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LiveMART</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© 2024 LiveMART. All rights reserved.</p>
          <p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Visit our store</a> | 
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support">Contact Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  // Welcome email
  welcomeEmail: (name, role) => {
    const content = `
      <h2>Welcome to LiveMART! 🎉</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining LiveMART as a <strong>${role}</strong>!</p>
      ${role === 'customer' ? `
        <p>You can now:</p>
        <ul>
          <li>Browse thousands of products from local retailers</li>
          <li>Enjoy fast delivery to your doorstep</li>
          <li>Track your orders in real-time</li>
        </ul>
      ` : role === 'retailer' ? `
        <p>Your account is pending approval. Once approved, you'll be able to:</p>
        <ul>
          <li>List your products on our platform</li>
          <li>Reach customers in your area</li>
          <li>Manage orders and inventory</li>
        </ul>
      ` : `
        <p>Your account is pending approval. Once approved, you'll be able to:</p>
        <ul>
          <li>List your wholesale products</li>
          <li>Connect with retailers</li>
          <li>Manage bulk orders</li>
        </ul>
      `}
      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Start Shopping</a>
      </p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The LiveMART Team</p>
    `;
    return emailTemplates.baseTemplate(content);
  },

  // Account approval email
  approvalEmail: (name, role) => {
    const content = `
      <h2>Your Account Has Been Approved! ✅</h2>
      <p>Hi ${name},</p>
      <p>Great news! Your ${role} account has been approved by our admin team.</p>
      <p>You can now access all features of your ${role} dashboard.</p>
      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Dashboard</a>
      </p>
      <p>Welcome aboard!</p>
      <p>Best regards,<br>The LiveMART Team</p>
    `;
    return emailTemplates.baseTemplate(content);
  },

  // Order confirmation
  orderConfirmation: (order, customer) => {
    const itemsHtml = order.items.map(item => `
      <div class="order-item">
        <strong>${item.productName}</strong><br>
        Quantity: ${item.quantity} × ₹${item.pricePerUnit} = ₹${item.totalPrice}
      </div>
    `).join('');

    const content = `
      <h2>Order Confirmation 📦</h2>
      <p>Hi ${customer.name},</p>
      <p>Thank you for your order! We've received your order and it's being processed.</p>
      
      <div class="order-details">
        <h3>Order #${order._id}</h3>
        <p><strong>Order Type:</strong> ${order.orderType}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        
        <h4>Items:</h4>
        ${itemsHtml}
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
          <p><strong>Subtotal:</strong> ₹${order.subtotal}</p>
          <p><strong>Tax (5%):</strong> ₹${order.tax}</p>
          <p><strong>Delivery Fee:</strong> ₹${order.deliveryFee}</p>
          <p class="total">Total: ₹${order.totalAmount}</p>
        </div>
        
        <h4>Delivery Address:</h4>
        <p>
          ${order.deliveryAddress.street}<br>
          ${order.deliveryAddress.city}, ${order.deliveryAddress.state}<br>
          ${order.deliveryAddress.pincode}<br>
          Phone: ${order.deliveryAddress.phone}
        </p>
        
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>
      </div>
      
      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}" class="button">Track Your Order</a>
      </p>
      
      <p>We'll notify you when your order ships!</p>
      <p>Best regards,<br>The LiveMART Team</p>
    `;
    return emailTemplates.baseTemplate(content);
  },

  // Order status update
  orderStatusUpdate: (order, customer, newStatus) => {
    const statusMessages = {
      confirmed: '✅ Your order has been confirmed!',
      processing: '⚙️ Your order is being processed',
      shipped: '🚚 Your order has been shipped!',
      delivered: '✨ Your order has been delivered!',
      cancelled: '❌ Your order has been cancelled'
    };

    const content = `
      <h2>${statusMessages[newStatus]}</h2>
      <p>Hi ${customer.name},</p>
      <p>Your order #${order._id} status has been updated to: <strong>${newStatus}</strong></p>
      
      ${newStatus === 'shipped' ? `
        <p>Your order is on its way! Expected delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>
      ` : ''}
      
      ${newStatus === 'delivered' ? `
        <p>Your order has been delivered. We hope you enjoy your purchase!</p>
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}/review" class="button">Leave a Review</a>
        </p>
      ` : ''}
      
      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}" class="button">View Order Details</a>
      </p>
      
      <p>Best regards,<br>The LiveMART Team</p>
    `;
    return emailTemplates.baseTemplate(content);
  },

  // New order notification for seller
  newOrderSeller: (order, seller, orderItems) => {
    const itemsHtml = orderItems.map(item => `
      <div class="order-item">
        <strong>${item.productName}</strong><br>
        Quantity: ${item.quantity} × ₹${item.pricePerUnit} = ₹${item.totalPrice}
      </div>
    `).join('');

    const content = `
      <h2>New Order Received! 🎉</h2>
      <p>Hi ${seller.name},</p>
      <p>You have received a new order on LiveMART!</p>
      
      <div class="order-details">
        <h3>Order #${order._id}</h3>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        
        <h4>Your Items:</h4>
        ${itemsHtml}
        
        <p class="total">Your Revenue: ₹${orderItems.reduce((sum, item) => sum + item.totalPrice, 0)}</p>
        
        <h4>Customer Details:</h4>
        <p>
          ${order.deliveryAddress.street}<br>
          ${order.deliveryAddress.city}, ${order.deliveryAddress.state}<br>
          Phone: ${order.deliveryAddress.phone}
        </p>
      </div>
      
      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller/orders/${order._id}" class="button">View Order</a>
      </p>
      
      <p>Please process this order as soon as possible.</p>
      <p>Best regards,<br>The LiveMART Team</p>
    `;
    return emailTemplates.baseTemplate(content);
  },

  // Password reset email
  passwordReset: (name, resetToken) => {
    const content = `
      <h2>Password Reset Request 🔐</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password for your LiveMART account.</p>
      <p>Click the button below to reset your password:</p>
      
      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}" class="button">Reset Password</a>
      </p>
      
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The LiveMART Team</p>
    `;
    return emailTemplates.baseTemplate(content);
  }
};

module.exports = emailTemplates;
