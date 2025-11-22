const transporter = require('../config/email');
const emailTemplates = require('../templates/emailTemplates');
const User = require('../models/userModel');

class EmailService {
  // Send welcome email
  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: `"LiveMART" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Welcome to LiveMART!',
        html: emailTemplates.welcomeEmail(user.name, user.role)
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send account approval email
  async sendApprovalEmail(user) {
    try {
      const mailOptions = {
        from: `"LiveMART" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Your Account Has Been Approved!',
        html: emailTemplates.approvalEmail(user.name, user.role)
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Approval email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending approval email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send order confirmation to customer
  async sendOrderConfirmation(order, customer) {
    try {
        console.log('Preparing order confirmation email for:', customer.email);
    
    const mailOptions = {
      from: `"LiveMART" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `Order Confirmation - Order #${order._id}`,
      html: emailTemplates.orderConfirmation(order, customer)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return { success: false, error: error.message };
  }
  }

  // Send order status update
  async sendOrderStatusUpdate(order, customerId, newStatus) {
    try {
      const customer = await User.findById(customerId).select('name email');
      if (!customer) return { success: false, error: 'Customer not found' };

      const mailOptions = {
        from: `"LiveMART" <${process.env.EMAIL_USER}>`,
        to: customer.email,
        subject: `Order Update - Order #${order._id}`,
        html: emailTemplates.orderStatusUpdate(order, customer, newStatus)
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Order status update sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending order status update:', error);
      return { success: false, error: error.message };
    }
  }

  // Send new order notification to sellers
  async sendNewOrderToSellers(order) {
    try {
      // Group items by seller
      const sellerItems = {};
      for (const item of order.items) {
        if (!sellerItems[item.seller]) {
          sellerItems[item.seller] = [];
        }
        sellerItems[item.seller].push(item);
      }

      // Send email to each seller
      const promises = [];
      for (const [sellerId, items] of Object.entries(sellerItems)) {
        const seller = await User.findById(sellerId).select('name email');
        if (seller) {
          const mailOptions = {
            from: `"LiveMART" <${process.env.EMAIL_USER}>`,
            to: seller.email,
            subject: 'New Order Received!',
            html: emailTemplates.newOrderSeller(order, seller, items)
          };
          promises.push(transporter.sendMail(mailOptions));
        }
      }

      const results = await Promise.all(promises);
      console.log('New order notifications sent to sellers');
      return { success: true, count: results.length };
    } catch (error) {
      console.error('Error sending seller notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    try {
      const mailOptions = {
        from: `"LiveMART" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: emailTemplates.passwordReset(user.name, resetToken)
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send OTP email
  async sendOTPEmail(email, otp, purpose) {
    try {
      const mailOptions = {
        from: `"LiveMART" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: purpose === 'registration' 
          ? 'Verify Your Email - Registration OTP' 
          : 'Login Verification OTP',
        html: emailTemplates.otpEmail(email, otp, purpose)
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('OTP email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();