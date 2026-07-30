import { z } from 'zod';

export const VehicleTypeEnum = z.enum(['BUS', 'VAN', 'MINI_BUS', 'CAR', 'OTHER']);
export const VehicleStatusEnum = z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE', 'RETIRED']);
export const DriverStatusEnum = z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'INACTIVE']);
export const RouteStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export const StopStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export const TransportAssignmentStatusEnum = z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'COMPLETED']);
export const GpsStatusEnum = z.enum(['LIVE', 'IDLE', 'OFFLINE']);
export const MaintenanceTypeEnum = z.enum([
  'SERVICE_SCHEDULE',
  'FUEL_LOG',
  'REPAIR',
  'INSURANCE_RENEWAL',
  'FITNESS_RENEWAL',
  'OTHER',
]);
export const MaintenanceStatusEnum = z.enum(['COMPLETED', 'SCHEDULED', 'IN_PROGRESS', 'CANCELLED']);
export const FuelTypeEnum = z.enum(['DIESEL', 'PETROL', 'CNG', 'EV']);

// Insurance and Fitness Certificates
export const InsuranceDetailsSchema = z.object({
  policyNumber: z.string().min(1, 'Policy number is required'),
  insurer: z.string().min(1, 'Insurer is required'),
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
  documentUrl: z.string().optional(),
});

export const FitnessCertificateSchema = z.object({
  certificateNumber: z.string().min(1, 'Certificate number is required'),
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
  documentUrl: z.string().optional(),
});

export const MaintenanceScheduleSchema = z.object({
  lastServiceDate: z.string().or(z.date()).optional(),
  nextServiceDate: z.string().or(z.date()).optional(),
  intervalDays: z.number().int().positive().default(90),
  mileageAtLastService: z.number().nonnegative().optional(),
});

// Vehicle Schema
export const VehicleSchema = z.object({
  _id: z.string().optional(),
  schoolId: z.string().default('LAPS-GOHAD'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  vehicleType: VehicleTypeEnum.default('BUS'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  status: VehicleStatusEnum.default('ACTIVE'),
  insuranceDetails: InsuranceDetailsSchema.optional(),
  fitnessCertificate: FitnessCertificateSchema.optional(),
  maintenanceSchedule: MaintenanceScheduleSchema.optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const CreateVehicleSchema = VehicleSchema.omit({
  _id: true,
  schoolId: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

// Driver Profile Schema
export const DriverProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid mobile number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pinCode: z.string().min(1, 'Pin code is required'),
  profilePictureUrl: z.string().optional(),
});

export const LicenseDetailsSchema = z.object({
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseType: z.string().min(1, 'License type is required'),
  issuingAuthority: z.string().min(1, 'Issuing authority is required'),
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
  documentUrl: z.string().optional(),
});

export const EmergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

export const BackgroundVerificationSchema = z.object({
  isVerified: z.boolean().default(false),
  verificationDate: z.string().or(z.date()).optional(),
  agencyName: z.string().optional(),
  referenceNumber: z.string().optional(),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).default('PENDING'),
});

export const DriverSchema = z.object({
  _id: z.string().optional(),
  schoolId: z.string().default('LAPS-GOHAD'),
  driverProfile: DriverProfileSchema,
  licenseDetails: LicenseDetailsSchema,
  emergencyContact: EmergencyContactSchema,
  medicalExpiry: z.string().or(z.date()),
  backgroundVerification: BackgroundVerificationSchema.optional(),
  status: DriverStatusEnum.default('ACTIVE'),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const CreateDriverSchema = DriverSchema.omit({
  _id: true,
  schoolId: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDriverSchema = CreateDriverSchema.partial();

// Stop Schema
export const GpsCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const StopSchema = z.object({
  _id: z.string().optional(),
  schoolId: z.string().default('LAPS-GOHAD'),
  stopName: z.string().min(1, 'Stop name is required'),
  stopCode: z.string().min(1, 'Stop code is required'),
  gpsCoordinates: GpsCoordinatesSchema,
  pickupTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid HH:mm format required'),
  dropTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid HH:mm format required'),
  landmark: z.string().optional(),
  studentCount: z.number().nonnegative().default(0),
  status: StopStatusEnum.default('ACTIVE'),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const CreateStopSchema = StopSchema.omit({
  _id: true,
  schoolId: true,
  studentCount: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateStopSchema = CreateStopSchema.partial();

// Route Schema
export const RouteStopItemSchema = z.object({
  stopId: z.string().min(1, 'Stop ID is required'),
  orderSequence: z.number().int().positive(),
  estimatedArrivalFromStartMinutes: z.number().int().nonnegative(),
  studentCount: z.number().nonnegative().default(0),
});

export const RouteEndpointSchema = z.object({
  name: z.string().min(1, 'Endpoint name is required'),
  address: z.string().optional(),
  gpsCoordinates: GpsCoordinatesSchema.optional(),
});

export const RouteSchema = z.object({
  _id: z.string().optional(),
  schoolId: z.string().default('LAPS-GOHAD'),
  routeName: z.string().min(1, 'Route name is required'),
  routeCode: z.string().min(1, 'Route code is required'),
  source: RouteEndpointSchema,
  destination: RouteEndpointSchema,
  stops: z.array(RouteStopItemSchema).min(1, 'At least one stop is required'),
  estimatedDurationMinutes: z.number().int().positive(),
  distanceKm: z.number().nonnegative(),
  status: RouteStatusEnum.default('ACTIVE'),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const CreateRouteSchema = RouteSchema.omit({
  _id: true,
  schoolId: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateRouteSchema = CreateRouteSchema.partial();

// StudentTransportAssignment Schema
export const StudentTransportAssignmentSchema = z.object({
  _id: z.string().optional(),
  schoolId: z.string().default('LAPS-GOHAD'),
  studentId: z.string().min(1, 'Student ID is required'),
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  routeId: z.string().min(1, 'Route ID is required'),
  stopId: z.string().min(1, 'Stop ID is required'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  effectiveFrom: z.string().or(z.date()).optional(),
  effectiveUntil: z.string().or(z.date()).optional(),
  transportFeeAmount: z.number().nonnegative().default(0),
  status: TransportAssignmentStatusEnum.default('ACTIVE'),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const CreateAssignmentSchema = StudentTransportAssignmentSchema.omit({
  _id: true,
  schoolId: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateAssignmentSchema = CreateAssignmentSchema.partial();

// GPS Telemetry and Location
export const GpsTelemetrySchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  routeId: z.string().optional(),
  driverId: z.string().optional(),
  coordinates: GpsCoordinatesSchema,
  speedKmh: z.number().nonnegative().default(0),
  headingDegrees: z.number().min(0).max(359).default(0),
  lastKnownLocationAddress: z.string().optional(),
});

export const GpsLocationSchema = z.object({
  _id: z.string().optional(),
  schoolId: z.string().default('LAPS-GOHAD'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  routeId: z.string().optional(),
  driverId: z.string().optional(),
  timestamp: z.string().or(z.date()),
  coordinates: GpsCoordinatesSchema,
  speedKmh: z.number().nonnegative(),
  headingDegrees: z.number().min(0).max(359),
  lastKnownLocationAddress: z.string().optional(),
  routeProgress: z
    .object({
      nextStopId: z.string().optional(),
      etaMinutes: z.number().int().nonnegative().optional(),
      distanceRemainingKm: z.number().nonnegative().optional(),
      isOffRoute: z.boolean().default(false),
    })
    .optional(),
  status: GpsStatusEnum.default('LIVE'),
});

// Maintenance Record Schema
export const FuelDetailsSchema = z.object({
  liters: z.number().positive(),
  costPerLiter: z.number().positive(),
  fuelType: FuelTypeEnum,
});

export const MaintenanceRecordSchema = z.object({
  _id: z.string().optional(),
  schoolId: z.string().default('LAPS-GOHAD'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  maintenanceType: MaintenanceTypeEnum,
  serviceDate: z.string().or(z.date()),
  odometerReadingKm: z.number().nonnegative(),
  costAmount: z.number().nonnegative(),
  serviceProvider: z.string().min(1, 'Service provider is required'),
  description: z.string().min(1, 'Description is required'),
  nextScheduledDate: z.string().or(z.date()).optional(),
  nextScheduledOdometerKm: z.number().nonnegative().optional(),
  fuelDetails: FuelDetailsSchema.optional(),
  status: MaintenanceStatusEnum.default('COMPLETED'),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const CreateMaintenanceRecordSchema = MaintenanceRecordSchema.omit({
  _id: true,
  schoolId: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateMaintenanceRecordSchema = CreateMaintenanceRecordSchema.partial();

// Transport Summary Schema
export const TransportSummarySchema = z.object({
  _id: z.string().optional(),
  schoolId: z.string().default('LAPS-GOHAD'),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  totalVehicles: z.number().nonnegative().default(0),
  activeVehicles: z.number().nonnegative().default(0),
  inMaintenanceVehicles: z.number().nonnegative().default(0),
  totalDrivers: z.number().nonnegative().default(0),
  totalRoutes: z.number().nonnegative().default(0),
  totalStops: z.number().nonnegative().default(0),
  totalAssignedStudents: z.number().nonnegative().default(0),
  totalFleetCapacity: z.number().nonnegative().default(0),
  overallOccupancyPercentage: z.number().nonnegative().default(0),
  vehicleUtilization: z
    .array(
      z.object({
        vehicleId: z.string(),
        registrationNumber: z.string(),
        capacity: z.number(),
        activeAssignments: z.number(),
        occupancyPercentage: z.number(),
        status: z.string(),
      }),
    )
    .optional(),
  routeUtilization: z
    .array(
      z.object({
        routeId: z.string(),
        routeName: z.string(),
        totalStops: z.number(),
        totalStudents: z.number(),
        assignedVehicleId: z.string().optional(),
      }),
    )
    .optional(),
  maintenanceSummary: z
    .object({
      totalSpendYearToDate: z.number().nonnegative(),
      pendingRenewalsCount: z.number().nonnegative(),
      vehiclesDueForServiceCount: z.number().nonnegative(),
    })
    .optional(),
  lastCalculatedAt: z.string().or(z.date()).optional(),
});

// TypeScript Types
export type IVehicle = z.infer<typeof VehicleSchema>;
export type ICreateVehicle = z.infer<typeof CreateVehicleSchema>;
export type IUpdateVehicle = z.infer<typeof UpdateVehicleSchema>;

export type IDriver = z.infer<typeof DriverSchema>;
export type ICreateDriver = z.infer<typeof CreateDriverSchema>;
export type IUpdateDriver = z.infer<typeof UpdateDriverSchema>;

export type IStop = z.infer<typeof StopSchema>;
export type ICreateStop = z.infer<typeof CreateStopSchema>;
export type IUpdateStop = z.infer<typeof UpdateStopSchema>;

export type IRoute = z.infer<typeof RouteSchema>;
export type ICreateRoute = z.infer<typeof CreateRouteSchema>;
export type IUpdateRoute = z.infer<typeof UpdateRouteSchema>;

export type IStudentTransportAssignment = z.infer<typeof StudentTransportAssignmentSchema>;
export type ICreateAssignment = z.infer<typeof CreateAssignmentSchema>;
export type IUpdateAssignment = z.infer<typeof UpdateAssignmentSchema>;

export type IGpsLocation = z.infer<typeof GpsLocationSchema>;
export type IGpsTelemetry = z.infer<typeof GpsTelemetrySchema>;

export type IMaintenanceRecord = z.infer<typeof MaintenanceRecordSchema>;
export type ICreateMaintenanceRecord = z.infer<typeof CreateMaintenanceRecordSchema>;
export type IUpdateMaintenanceRecord = z.infer<typeof UpdateMaintenanceRecordSchema>;

export type ITransportSummary = z.infer<typeof TransportSummarySchema>;
