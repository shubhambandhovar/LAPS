import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import {
  ReportTemplate,
  SavedReport,
  ScheduledReport,
  Student,
  Employee,
  BookIssue,
  Asset,
  Payment,
  Attendance
} from '../models';
import { isValidObjectId } from 'mongoose';

export class ReportsController {
  
  // Executive Dashboard KPIs
  static async getExecutiveDashboard(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;

      const [
        totalStudents,
        totalEmployees,
        totalFeeCollected,
        activeBookIssues,
        totalAssetValueResult
      ] = await Promise.all([
        Student.countDocuments({ schoolId, enrollmentStatus: 'ENROLLED' }),
        Employee.countDocuments({ schoolId, status: 'ACTIVE' }),
        Payment.aggregate([
          { $match: { schoolId, status: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$amountPaid' } } }
        ]),
        BookIssue.countDocuments({ schoolId, status: { $in: ['ISSUED', 'OVERDUE'] } }),
        Asset.aggregate([
          { $match: { schoolId } },
          { $group: { _id: null, total: { $sum: '$purchasePrice' } } }
        ])
      ]);

      const totalFees = totalFeeCollected.length > 0 ? totalFeeCollected[0].total : 0;
      const totalAssetValue = totalAssetValueResult.length > 0 ? totalAssetValueResult[0].total : 0;

      return sendSuccess(res, 200, 'Success', {
        totalStudents,
        totalEmployees,
        totalFees,
        activeBookIssues,
        totalAssetValue
      });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch executive dashboard data');
    }
  }

  // Analytics by Module
  static async getModuleAnalytics(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { module } = req.params; // 'academic', 'fees', 'attendance', 'hr', 'library', 'inventory'

      let data: any = {};

      if (module === 'attendance') {
        data = await Attendance.aggregate([
          { $match: { schoolId } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
      } else if (module === 'fees') {
        data = await Payment.aggregate([
          { $match: { schoolId, status: 'COMPLETED' } },
          { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } }, total: { $sum: '$amountPaid' } } },
          { $sort: { _id: 1 } }
        ]);
      } else {
        data = { message: 'Analytics for this module is under construction' };
      }

      return sendSuccess(res, 200, 'Success', { module, analytics: data });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch analytics');
    }
  }

  // Generate Report
  static async generateReport(req: Request, res: Response) {
    try {
      const { module } = req.body;

      // Mock generation logic based on filters
      return sendSuccess(res, 200, 'Success', {
        reportData: [
          { id: 1, info: 'Mock Data row 1 for ' + module },
          { id: 2, info: 'Mock Data row 2 for ' + module }
        ]
      });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to generate report');
    }
  }

  // Export Report
  static async exportReport(req: Request, res: Response) {
    try {
      const { format } = req.body; // 'PDF', 'EXCEL', 'CSV'
      
      // We will implement actual generation in a service. For now, return mock URL or stream.
      return sendSuccess(res, 200, 'Success', {
        url: `https://laps-erp.s3.amazonaws.com/reports/mock_report.${format.toLowerCase()}`
      });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to export report');
    }
  }

  // Templates
  static async getTemplates(req: Request, res: Response) {
    try {
      const templates = await ReportTemplate.find({ schoolId: req.user?.schoolId });
      return sendSuccess(res, 200, 'Success', { templates });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch templates');
    }
  }

  static async createTemplate(req: Request, res: Response) {
    try {
      const template = new ReportTemplate({ ...req.body, schoolId: req.user?.schoolId, createdBy: req.user?.id });
      await template.save();
      return sendSuccess(res, 201, 'Success', { template });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to create template');
    }
  }

  // Saved Reports
  static async getSavedReports(req: Request, res: Response) {
    try {
      const reports = await SavedReport.find({ schoolId: req.user?.schoolId }).populate('templateId');
      return sendSuccess(res, 200, 'Success', { reports });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch saved reports');
    }
  }

  static async createSavedReport(req: Request, res: Response) {
    try {
      const report = new SavedReport({ ...req.body, schoolId: req.user?.schoolId, createdBy: req.user?.id });
      await report.save();
      return sendSuccess(res, 201, 'Success', { report });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to save report');
    }
  }

  // Scheduled Reports
  static async getScheduledReports(req: Request, res: Response) {
    try {
      const reports = await ScheduledReport.find({ schoolId: req.user?.schoolId }).populate('savedReportId');
      return sendSuccess(res, 200, 'Success', { reports });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch scheduled reports');
    }
  }

  static async createScheduledReport(req: Request, res: Response) {
    try {
      const schedule = new ScheduledReport({ ...req.body, schoolId: req.user?.schoolId, createdBy: req.user?.id });
      await schedule.save();
      return sendSuccess(res, 201, 'Success', { schedule });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to schedule report');
    }
  }

  static async deleteScheduledReport(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid ID');
      await ScheduledReport.findOneAndDelete({ _id: req.params.id, schoolId: req.user?.schoolId });
      return sendSuccess(res, 200, 'Success', null);
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to delete schedule');
    }
  }
}
