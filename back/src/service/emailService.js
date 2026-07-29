// src/service/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendOrderConfirmation(order, user) {
    try {
      const mailOptions = {
        from: `"Pizza Pete\'s" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `🎉 Confirmation de commande #${order.orderNumber}`,
        html: this.generateOrderEmailHTML(order, user)
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de confirmation envoyé à ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return false;
    }
  }

  generateOrderEmailHTML(order, user) {
    const deliveryTime = new Date(order.estimatedDeliveryTime).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsHTML = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.pizzaName}</strong><br>
          <small>Taille: ${item.config.size === 'small' ? 'Petite' : item.config.size === 'medium' ? 'Moyenne' : 'Grande'}</small><br>
          <small>Pâte: ${item.config.crust === 'thin' ? 'Fine' : item.config.crust === 'pan' ? 'Épaisse' : 'Fourrée'}</small><br>
          <small>Quantité: ${item.config.quantity}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${(item.price).toFixed(3)} DT
        </td>
      </tr>
    `).join('');

    // Calculer le montant HT (sans TVA) pour l'affichage
    // Si order.total inclut déjà la TVA, on peut afficher directement
    const displaySubtotal = order.subtotal.toFixed(3);
    const displayDeliveryFee = order.deliveryFee.toFixed(3);
    const displayTotal = order.total.toFixed(3); // Ce total inclut déjà la TVA

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-number { font-size: 24px; font-weight: bold; color: #e74c3c; }
          .total { font-size: 20px; font-weight: bold; color: #27ae60; }
          .delivery-info { background: #e8f4fc; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f2f2f2; padding: 10px; text-align: left; }
          .note { font-size: 12px; color: #666; margin-top: 5px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍕 Pizza Pete's</h1>
            <h2>Votre commande est confirmée !</h2>
          </div>
          
          <div class="content">
            <p>Bonjour ${user.firstName},</p>
            <p>Merci pour votre commande ! Nous sommes ravis de vous servir.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <div class="order-number">Commande #${order.orderNumber}</div>
              <div>Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</div>
            </div>
            
            <div class="delivery-info">
              <h3>📦 Informations de livraison</h3>
              <p><strong>Adresse:</strong> ${order.deliveryAddress.address}, ${order.deliveryAddress.city}</p>
              <p><strong>Méthode:</strong> ${order.deliveryMethod === 'delivery' ? 'Livraison' : 'À emporter'}</p>
              <p><strong>Temps estimé:</strong> ${deliveryTime}</p>
              <p><strong>Paiement:</strong> ${order.paymentMethod === 'cash' ? 'À la livraison' : 'Carte bancaire'}</p>
            </div>
            
            <h3>🍕 Vos pizzas</h3>
            <table>
              <thead>
                <tr>
                  <th>Article</th>
                  <th style="text-align: right;">Prix</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 20px;">
              <div>Sous-total: <strong>${displaySubtotal} DT</strong></div>
              <div>Frais de livraison: <strong>${displayDeliveryFee} DT</strong></div>
              <div class="total">Total TTC: ${displayTotal} DT</div>
              <div class="note">TVA incluse</div>
            </div>
            
            <div style="background: #e8f6ef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>📞 Contact</h3>
              <p>Si vous avez des questions concernant votre commande, contactez-nous :</p>
              <p>📧 support@pizzapetes.com</p>
              <p>📞 +216 12 345 678</p>
            </div>
            
            <p>À bientôt chez Pizza Pete's ! 🍕</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Pizza Pete's. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendOrderStatusUpdate(order, user, status) {
    try {
      const statusMessages = {
        'confirmed': 'confirmée',
        'preparing': 'en préparation',
        'out_for_delivery': 'en route vers vous',
        'delivered': 'livrée',
        'cancelled': 'annulée'
      };

      const mailOptions = {
        from: `"Pizza Pete\'s" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `📦 Mise à jour commande #${order.orderNumber}`,
        html: this.generateStatusUpdateHTML(order, user, status, statusMessages[status])
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de mise à jour envoyé à ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email status:', error);
      return false;
    }
  }

  generateStatusUpdateHTML(order, user, status, statusText) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${status === 'cancelled' ? '#e74c3c' : '#3498db'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { 
            background: ${status === 'cancelled' ? '#e74c3c' : '#27ae60'}; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 20px; 
            display: inline-block; 
            font-weight: bold; 
            margin: 10px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍕 Pizza Pete's</h1>
            <h2>Mise à jour de votre commande</h2>
          </div>
          
          <div class="content">
            <p>Bonjour ${user.firstName},</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <div class="status-badge">Votre commande est ${statusText}</div>
              <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                Commande #${order.orderNumber}
              </div>
            </div>
            
            <p><strong>Détails de la commande:</strong></p>
            <ul>
              <li>Montant total TTC: ${order.total.toFixed(3)} DT (TVA incluse)</li>
              <li>Adresse: ${order.deliveryAddress.address}, ${order.deliveryAddress.city}</li>
              ${status === 'out_for_delivery' ? '<li>Notre livreur est en route vers vous !</li>' : ''}
              ${status === 'delivered' ? '<li>Votre commande a été livrée. Bon appétit !</li>' : ''}
              ${status === 'cancelled' ? '<li>Votre commande a été annulée. Pour toute question, contactez notre service client.</li>' : ''}
            </ul>
            
            ${status === 'preparing' ? '<p>👨‍🍳 Nos chefs préparent vos pizzas avec soin !</p>' : ''}
            ${status === 'out_for_delivery' ? '<p>🚚 Votre commande sera bientôt chez vous !</p>' : ''}
            
            <div style="margin-top: 30px; padding: 15px; background: #f2f2f2; border-radius: 5px;">
              <p>📞 Pour toute question: +216 12 345 678</p>
              <p>📧 Email: support@pizzapetes.com</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();