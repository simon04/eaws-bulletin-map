import * as z from "zod/mini";

export const CustomDataSchema = z.optional(z.any());
export type CustomData = z.infer<typeof CustomDataSchema>;

export const AspectSchema = z.enum(["E", "N", "n/a", "NE", "NW", "S", "SE", "SW", "W"]);
export type Aspect = z.infer<typeof AspectSchema>;

export const DangerRatingValueSchema = z.enum([
  "considerable",
  "high",
  "low",
  "moderate",
  "no_rating",
  "no_snow",
  "very_high",
]);
export type DangerRatingValue = z.infer<typeof DangerRatingValueSchema>;

export const ExpectedAvalancheFrequencySchema = z.enum(["few", "many", "none", "some"]);
export type ExpectedAvalancheFrequency = z.infer<typeof ExpectedAvalancheFrequencySchema>;

export const AvalancheProblemTypeSchema = z.enum([
  "cornices",
  "favourable_situation",
  "gliding_snow",
  "new_snow",
  "no_distinct_avalanche_problem",
  "persistent_weak_layers",
  "wet_snow",
  "wind_slab",
]);
export type AvalancheProblemType = z.infer<typeof AvalancheProblemTypeSchema>;

export const ExpectedSnowpackStabilitySchema = z.enum(["fair", "good", "poor", "very_poor"]);
export type ExpectedSnowpackStability = z.infer<typeof ExpectedSnowpackStabilitySchema>;

export const ValidTimePeriodSchema = z.enum(["all_day", "earlier", "later"]);
export type ValidTimePeriod = z.infer<typeof ValidTimePeriodSchema>;

export const TendencyTypeSchema = z.enum(["decreasing", "increasing", "steady"]);
export type TendencyType = z.infer<typeof TendencyTypeSchema>;

export const TextsSchema = z.object({
  comment: z.optional(z.string()),
  highlights: z.optional(z.string()),
});
export type Texts = z.infer<typeof TextsSchema>;

export const ElevationBoundaryOrBandSchema = z.object({
  lowerBound: z.optional(z.string()),
  upperBound: z.optional(z.string()),
});
export type ElevationBoundaryOrBand = z.infer<typeof ElevationBoundaryOrBandSchema>;

export const ExternalFileSchema = z.object({
  description: z.optional(z.string()),
  fileReferenceURI: z.optional(z.string()),
  fileType: z.optional(z.string()),
});
export type ExternalFile = z.infer<typeof ExternalFileSchema>;

export const ValidTimeSchema = z.object({
  endTime: z.optional(z.coerce.date()),
  startTime: z.optional(z.coerce.date()),
});
export type ValidTime = z.infer<typeof ValidTimeSchema>;

export const MetaDataSchema = z.object({
  comment: z.optional(z.string()),
  extFiles: z.optional(z.array(ExternalFileSchema)),
});
export type MetaData = z.infer<typeof MetaDataSchema>;

export const DangerRatingSchema = z.object({
  aspects: z.optional(z.array(AspectSchema)),
  customData: CustomDataSchema,
  elevation: z.optional(ElevationBoundaryOrBandSchema),
  mainValue: z.optional(DangerRatingValueSchema),
  metaData: z.optional(MetaDataSchema),
  validTimePeriod: z.optional(ValidTimePeriodSchema),
});
export type DangerRating = z.infer<typeof DangerRatingSchema>;

export const RegionSchema = z.object({
  customData: CustomDataSchema,
  metaData: z.optional(MetaDataSchema),
  name: z.optional(z.string()),
  regionID: z.string(),
});
export type Region = z.infer<typeof RegionSchema>;

export const PersonSchema = z.object({
  customData: CustomDataSchema,
  metaData: z.optional(MetaDataSchema),
  name: z.optional(z.string()),
  website: z.optional(z.string()),
});
export type Person = z.infer<typeof PersonSchema>;

export const AvalancheBulletinProviderSchema = z.object({
  contactPerson: z.optional(PersonSchema),
  customData: CustomDataSchema,
  metaData: z.optional(MetaDataSchema),
  name: z.optional(z.string()),
  website: z.optional(z.string()),
});
export type AvalancheBulletinProvider = z.infer<typeof AvalancheBulletinProviderSchema>;

export const TendencySchema = z.object({
  comment: z.optional(z.string()),
  highlights: z.optional(z.string()),
  customData: CustomDataSchema,
  metaData: z.optional(MetaDataSchema),
  tendencyType: z.optional(TendencyTypeSchema),
  validTime: z.optional(ValidTimeSchema),
});
export type Tendency = z.infer<typeof TendencySchema>;

export const AvalancheProblemSchema = z.object({
  aspects: z.optional(z.array(AspectSchema)),
  avalancheSize: z.optional(z.number()),
  comment: z.optional(z.string()),
  customData: CustomDataSchema,
  dangerRatingValue: z.optional(DangerRatingValueSchema),
  elevation: z.optional(ElevationBoundaryOrBandSchema),
  frequency: z.optional(ExpectedAvalancheFrequencySchema),
  metaData: z.optional(MetaDataSchema),
  problemType: AvalancheProblemTypeSchema,
  snowpackStability: z.optional(ExpectedSnowpackStabilitySchema),
  validTimePeriod: z.optional(ValidTimePeriodSchema),
});
export type AvalancheProblem = z.infer<typeof AvalancheProblemSchema>;

export const AvalancheBulletinSourceSchema = z.object({
  person: z.optional(PersonSchema),
  provider: z.optional(AvalancheBulletinProviderSchema),
});
export type AvalancheBulletinSource = z.infer<typeof AvalancheBulletinSourceSchema>;

export const AvalancheBulletinSchema = z.object({
  avalancheActivity: z.optional(TextsSchema),
  avalancheProblems: z.optional(z.array(AvalancheProblemSchema)),
  bulletinID: z.optional(z.string()),
  customData: CustomDataSchema,
  dangerRatings: z.optional(z.array(DangerRatingSchema)),
  highlights: z.optional(z.string()),
  lang: z.optional(z.string()),
  metaData: z.optional(MetaDataSchema),
  nextUpdate: z.optional(z.coerce.date()),
  publicationTime: z.coerce.date(),
  regions: z.optional(z.array(RegionSchema)),
  snowpackStructure: z.optional(TextsSchema),
  source: z.optional(AvalancheBulletinSourceSchema),
  tendency: z.pipe(
    z.optional(z.union([TendencySchema, z.array(TendencySchema)])),
    z.transform((t) => (Array.isArray(t) ? t : [t])),
  ),
  travelAdvisory: z.optional(TextsSchema),
  unscheduled: z.optional(z.boolean()),
  validTime: z.optional(ValidTimeSchema),
  weatherForecast: z.optional(TextsSchema),
  weatherReview: z.optional(TextsSchema),
});
export type AvalancheBulletin = z.infer<typeof AvalancheBulletinSchema>;

export const AvalancheBulletinsSchema = z.object({
  bulletins: z.array(AvalancheBulletinSchema),
  customData: CustomDataSchema,
  metaData: z.optional(MetaDataSchema),
});
export type AvalancheBulletins = z.infer<typeof AvalancheBulletinsSchema>;
