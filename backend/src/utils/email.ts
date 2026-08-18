// backend/src/utils/email.ts
// Email utility

import { createTransport, Transporter } from 'nodemailer';
import { readFileSync } from 'fs';
import { compile } from 'handlebars';
import { join } from 'path';

interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}

class EmailService {
  private transporter: Transporter | null = null;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  async initialize(): Promise<void> {
    if (this.transporter) return;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('SMTP not configured, emails will be logged only');
      return;
    }

    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    // Verify connection
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified');
    } catch (error) {
      console.error('SMTP connection failed:', error);
    }

    // Load templates
    await this.loadTemplates();
  }

  private async loadTemplates(): Promise<void> {
    const templateDir = join(__dirname, '../../templates/email');
    // In production, load from files
    // For now, define inline templates
    this.templates.set('welcome', compile(`
      <h1>Welcome to Asset Maintenance Tool!</h1>
      <p>Hi {{firstName}},</p>
      <p>Your account has been created. Please <a href="{{loginUrl}}">log in</a> to get started.</p>
    `));

    this.templates.set('invite', compile(`
      <h1>You're Invited to Asset Maintenance Tool</h1>
      <p>Hi {{firstName}},</p>
      <p>{{inviterName}} invited you to join {{organizationName}}.</p>
      <p><a href="{{acceptUrl}}">Accept Invitation</a></p>
      <p>This invitation expires in 7 days.</p>
    `));

    this.templates.set('password-reset', compile(`
      <h1>Password Reset Request</h1>
      <p>Hi {{firstName}},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="{{resetUrl}}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `));

    this.templates.set('asset-overdue', compile(`
      <h1>Asset Overdue</h1>
      <p>Hi {{firstName}},</p>
      <p>The following asset is overdue for return:</p>
      <ul>
        <li><strong>Asset:</strong> {{assetTag}} - {{make}} {{model}}</li>
        <li><strong>Due Date:</strong> {{dueDate}}</li>
        <li><strong>Days Overdue:</strong> {{daysOverdue}}</li>
      </ul>
      <p>Please return the asset as soon as possible.</p>
    `));

    this.templates.set('maintenance-due', compile(`
      <h1>Maintenance Due</h1>
      <p>Hi {{firstName}},</p>
      <p>The following maintenance is due:</p>
      <ul>
        <li><strong>Asset:</strong> {{assetTag}} - {{make}} {{model}}</li>
        <li><strong>Type:</strong> {{type}}</li>
        <li><strong>Due Date:</strong> {{dueDate}}</li>
      </ul>
    `));

    this.templates.set('warranty-expiring', compile(`
      <h1>Warranty Expiring Soon</h1>
      <p>Hi {{firstName}},</p>
      <p>The following asset's warranty is expiring soon:</p>
      <ul>
        <li><strong>Asset:</strong> {{assetTag}} - {{make}} {{model}}</li>
        <li><strong>Warranty Expires:</strong> {{expiryDate}}</li>
        <li><strong>Days Remaining:</strong> {{daysRemaining}}</li>
      </ul>
    `));

    this.templates.set('audit-discrepancy', compile(`
      <h1>Audit Discrepancy Found</h1>
      <p>Hi {{firstName}},</p>
      <p>A discrepancy was found during audit:</p>
      <ul>
        <li><strong>Asset:</strong> {{assetTag}} - {{make}} {{model}}</li>
        <li><strong>Type:</strong> {{discrepancyType}}</li>
        <li><strong>Expected Location:</strong> {{expectedLocation}}</li>
        <li><strong>Found Location:</strong> {{foundLocation}}</li>
      </ul>
    `));

    this.templates.set('agent-offline', compile(`
      <h1>Agent Offline Alert</h1>
      <p>Hi {{firstName}},</p>
      <p>The following agent has been offline for more than 24 hours:</p>
      <ul>
        <li><strong>Asset:</strong> {{assetTag}}</li>
        <li><strong>Hostname:</strong> {{hostname}}</li>
        <li><strong>Last Seen:</strong> {{lastSeen}}</li>
      </ul>
    `));
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email would be sent (no SMTP configured):', options.subject);
      return true;
    }

    let html = options.html;
    if (options.template && this.templates.has(options.template)) {
      const template = this.templates.get(options.template)!;
      html = template(options.context || {});
    }

    const from = process.env.EMAIL_FROM || 'Asset Maintenance Tool <noreply@assetmt.com>';
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: options.subject,
        html: html || undefined,
        text: options.text || undefined,
        attachments: options.attachments,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Convenience methods
  async sendWelcomeEmail(email: string, firstName: string, loginUrl: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Welcome to Asset Maintenance Tool',
      template: 'welcome',
      context: { firstName, loginUrl },
    });
  }

  async sendInviteEmail(email: string, firstName: string, inviterName: string, organizationName: string, acceptUrl: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Invitation to join ${organizationName} on Asset Maintenance Tool`,
      template: 'invite',
      context: { firstName, inviterName, organizationName, acceptUrl },
    });
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetUrl: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: { firstName, resetUrl },
    });
  }

  async sendAssetOverdueEmail(email: string, firstName: string, asset: { tag: string; make: string; model: string; dueDate: Date; daysOverdue: number }): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Asset Overdue: ${asset.tag}`,
      template: 'asset-overdue',
      context: { firstName, ...asset, dueDate: asset.dueDate.toLocaleDateString() },
    });
  }

  async sendMaintenanceDueEmail(email: string, firstName: string, asset: { tag: string; make: string; model: string; type: string; dueDate: Date }): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Maintenance Due: ${asset.tag}`,
      template: 'maintenance-due',
      context: { firstName, ...asset, dueDate: asset.dueDate.toLocaleDateString() },
    });
  }

  async sendWarrantyExpiringEmail(email: string, firstName: string, asset: { tag: string; make: string; model: string; expiryDate: Date; daysRemaining: number }): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Warranty Expiring: ${asset.tag}`,
      template: 'warranty-expiring',
      context: { firstName, ...asset, expiryDate: asset.expiryDate.toLocaleDateString() },
    });
  }

  async sendAuditDiscrepancyEmail(email: string, firstName: string, discrepancy: { assetTag: string; make: string; model: string; type: string; expectedLocation: string; foundLocation: string }): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Audit Discrepancy: ${discrepancy.assetTag}`,
      template: 'audit-discrepancy',
      context: { firstName, ...discrepancy },
    });
  }

  async sendAgentOfflineEmail(email: string, firstName: string, agent: { assetTag: string; hostname: string; lastSeen: Date }): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Agent Offline: ${agent.assetTag}`,
      template: 'agent-offline',
      context: { firstName, ...agent, lastSeen: agent.lastSeen.toLocaleString() },
    });
  }
}

export const emailService = new EmailService();