import { Request, Response } from 'express';
import { UpdateNotificationPreferenceSchema } from '@laps/shared';
import { NotificationPreference } from '../models/NotificationPreference';
import { sendSuccess } from '../utils/response';

export const getMyPreferences = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  let preference = await NotificationPreference.findOne({ userId });

  if (!preference) {
    preference = await NotificationPreference.create({
      userId,
    });
  }

  sendSuccess(res, 200, 'User notification preferences retrieved successfully', preference);
};

export const updateMyPreferences = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const validated = UpdateNotificationPreferenceSchema.parse(req.body);

  let preference = await NotificationPreference.findOne({ userId });

  if (!preference) {
    preference = await NotificationPreference.create({
      userId,
      preferences: validated,
    });
  } else {
    preference = await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: { preferences: { ...preference.preferences, ...validated } } },
      { new: true, runValidators: true }
    );
  }

  sendSuccess(res, 200, 'User notification preferences updated successfully', preference);
};

export const getUserPreferences = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  let preference = await NotificationPreference.findOne({ userId });

  if (!preference) {
    preference = await NotificationPreference.create({
      userId,
    });
  }

  sendSuccess(res, 200, 'Notification preferences retrieved successfully', preference);
};
