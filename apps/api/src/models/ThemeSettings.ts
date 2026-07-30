import { Schema, model, Document } from 'mongoose';

export interface IThemeSettings {
  schoolId: string;
  logoUrl?: string;
  faviconUrl?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  footerText?: string;
  contactInfo?: {
    address?: string;
    phone?: string;
    email?: string;
    googleMapEmbedUrl?: string;
  };
}

export interface IThemeSettingsDocument extends IThemeSettings, Document {
  createdAt: Date;
  updatedAt: Date;
}

const ThemeSettingsSchema = new Schema<IThemeSettingsDocument>(
  {
    schoolId: {
      type: String,
      required: true,
      unique: true,
      default: 'LAPS-GOHAD',
    },
    logoUrl: { type: String },
    faviconUrl: { type: String },
    colors: {
      primary: { type: String },
      secondary: { type: String },
      accent: { type: String },
    },
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      youtube: { type: String },
      linkedin: { type: String },
    },
    footerText: { type: String },
    contactInfo: {
      address: { type: String },
      phone: { type: String },
      email: { type: String },
      googleMapEmbedUrl: { type: String },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
      },
    },
  }
);

export const ThemeSettings = model<IThemeSettingsDocument>('ThemeSettings', ThemeSettingsSchema);
