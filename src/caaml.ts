// Generated using https://app.quicktype.io/ from https://github.com/canadianavalancheassociation/caaml-bulletin-eaws/blob/05df09b/v6/json/CAAMLv6_BulletinEAWS.json

/**
 * JSON schema for EAWS avalanche bulletin collection following the CAAMLv6 schema
 */
export interface AvalancheBulletins {
  bulletins: AvalancheBulletin[];
  customData?: any;
  metaData?: MetaData;
}

/**
 * Avalanche Bulletin valid for a given set of regions.
 */
export interface AvalancheBulletin {
  /**
   * Texts element with highlight and comment for the avalanche activity.
   */
  avalancheActivity?: Texts;
  /**
   * Collection of Avalanche Problem elements for this bulletin.
   */
  avalancheProblems?: AvalancheProblem[];
  /**
   * Unique ID for the bulletin.
   */
  bulletinID?: string;
  customData?: any;
  /**
   * Collection of Danger Rating elements for this bulletin.
   */
  dangerRatings?: DangerRating[];
  /**
   * Contains an optional short text to highlight an exceptionally dangerous situation.
   */
  highlights?: string;
  /**
   * Two-letter language code (ISO 639-1).
   */
  lang?: string;
  metaData?: MetaData;
  /**
   * Time and date when the next bulletin will be published by the AWS to the Public. ISO 8601
   * timestamp in UTC or with time zone information.
   */
  nextUpdate?: Date;
  /**
   * Time and date when the bulletin was issued by the AWS to the Public. ISO 8601 timestamp
   * in UTC or with time zone information.
   */
  publicationTime?: Date;
  /**
   * Collection of region elements for which this bulletin is valid.
   */
  regions?: Region[];
  /**
   * Texts element with highlight and comment for details on the snowpack structure.
   */
  snowpackStructure?: Texts;
  /**
   * Details about the issuer/AWS of the bulletin.
   */
  source?: AvalancheBulletinSource;
  /**
   * Tendency element for a detailed description of the expected avalanche situation tendency
   * after the bulletin's period of validity.
   */
  tendency?: Tendency[];
  /**
   * Texts element with highlight and comment for travel advisory.
   */
  travelAdvisory?: Texts;
  /**
   * Flag if bulletin is unscheduled or not.
   */
  unscheduled?: boolean;
  /**
   * Date and Time from and until this bulletin is valid. ISO 8601 Timestamp in UTC or with
   * time zone information.
   */
  validTime?: ValidTime;
  /**
   * Texts element with highlight and comment for weather forecast information.
   */
  weatherForecast?: Texts;
  /**
   * Texts element with highlight and comment for weather review information.
   */
  weatherReview?: Texts;
}

/**
 * Texts element with highlight and comment for the avalanche activity.
 *
 * Texts contains a highlight and a comment string, where highlights could also be described
 * as a kind of headline for the longer comment. For text-formatting the HTML-Tags <br/> for
 * a new line, (<ul>,<ul/>) and (<li>,<li/>) for lists, (<h1>,<h1/>) to (<h6>,<h6/>) for
 * headings and (<b>,</b>) for a bold text are allowed.
 *
 * Texts element with highlight and comment for details on the snowpack structure.
 *
 * Texts element with highlight and comment for travel advisory.
 *
 * Texts element with highlight and comment for weather forecast information.
 *
 * Texts element with highlight and comment for weather review information.
 */
export interface Texts {
  comment?: string;
  highlights?: string;
}

/**
 * Defines an avalanche problem, its time, aspect, and elevation constraints. A textual
 * detail about the affected terrain can be given in the comment field. Also, details about
 * the expected avalanche size, snowpack stability and its frequency can be defined. The
 * implied danger rating value is optional.
 */
export interface AvalancheProblem {
  aspects?: Aspect[];
  avalancheSize?: number;
  comment?: string;
  customData?: any;
  dangerRatingValue?: DangerRatingValue;
  elevation?: ElevationBoundaryOrBand;
  frequency?: ExpectedAvalancheFrequency;
  metaData?: MetaData;
  problemType: AvalancheProblemType;
  snowpackStability?: ExpectedSnowpackStability;
  validTimePeriod?: ValidTimePeriod;
}

/**
 * An aspect can be defined as a set of aspects. The aspects are the expositions as in a
 * eight part (45°) segments. The allowed aspects are the four main cardinal directions and
 * the four intercardinal directions.
 */
export type Aspect = "E" | "N" | "n/a" | "NE" | "NW" | "S" | "SE" | "SW" | "W";

/**
 * Elevation describes either an elevation range below a certain bound (only upperBound is
 * set to a value) or above a certain bound (only lowerBound is set to a value). If both
 * values are set to a value, an elevation band is defined by this property. The value uses
 * a numeric value, not more detailed than 100m resolution. Additionally to the numeric
 * values also 'treeline' is allowed.
 */
export interface ElevationBoundaryOrBand {
  lowerBound?: string;
  upperBound?: string;
}

/**
 * Expected frequency of lowest snowpack stability, according to the EAWS definition. Three
 * stage scale (few, some, many).
 */
export type ExpectedAvalancheFrequency = "few" | "many" | "some";

/**
 * Meta data for various uses. Can be used to link to external files like maps, thumbnails
 * etc.
 */
export interface MetaData {
  comment?: string;
  extFiles?: ExternalFile[];
}

/**
 * External file is used to link to external files like maps, thumbnails etc.
 */
export interface ExternalFile {
  description?: string;
  fileReferenceURI?: string;
  fileType?: string;
}

/**
 * Expected avalanche problem, according to the EAWS avalanche problem definition.
 */
export type AvalancheProblemType =
  | "cornices"
  | "favourable_situation"
  | "gliding_snow"
  | "new_snow"
  | "no_distinct_avalanche_problem"
  | "persistent_weak_layers"
  | "wet_snow"
  | "wind_slab";

/**
 * Snowpack stability, according to the EAWS definition. Four stage scale (very poor, poor,
 * fair, good).
 */
export type ExpectedSnowpackStability = "fair" | "good" | "poor" | "very_poor";

/**
 * Valid time period can be used to limit the validity of an element to an earlier or later
 * period. It can be used to distinguish danger ratings or avalanche problems.
 */
export type ValidTimePeriod = "all_day" | "earlier" | "later";

/**
 * Defines a danger rating, its elevation constraints and the valid time period. If
 * validTimePeriod or elevation are constrained for a rating, it is expected to define a
 * dangerRating for all the other cases.
 */
export interface DangerRating {
  aspects?: Aspect[];
  customData?: any;
  elevation?: ElevationBoundaryOrBand;
  mainValue: DangerRatingValue;
  metaData?: MetaData;
  validTimePeriod?: ValidTimePeriod;
}

/**
 * Danger rating value, according to EAWS danger scale definition.
 */
export type DangerRatingValue =
  | "considerable"
  | "high"
  | "low"
  | "moderate"
  | "no_rating"
  | "no_snow"
  | "very_high";

/**
 * Region element describes a (micro) region. The regionID follows the EAWS schema. It is
 * recommended to have the region shape's files with the same IDs in
 * gitlab.com/eaws/eaws-regions. Additionally, the region name can be added.
 */
export interface Region {
  customData?: any;
  metaData?: MetaData;
  name?: string;
  regionID: string;
}

/**
 * Details about the issuer/AWS of the bulletin.
 *
 * Information about the bulletin source. Either as in a person or with a provider element
 * to specify details about the AWS.
 */
export interface AvalancheBulletinSource {
  person?: Person;
  provider?: AvalancheBulletinProvider;
}

/**
 * Details on a person.
 */
export interface Person {
  customData?: any;
  metaData?: MetaData;
  name?: string;
  website?: string;
}

/**
 * Information about the bulletin provider. Defines the name, website and/or contactPerson
 * (which could be the author) of the issuing AWS.
 */
export interface AvalancheBulletinProvider {
  contactPerson?: Person;
  customData?: any;
  metaData?: MetaData;
  name?: string;
  website?: string;
}

/**
 * Texts element with highlight and comment for the avalanche activity.
 *
 * Texts contains a highlight and a comment string, where highlights could also be described
 * as a kind of headline for the longer comment. For text-formatting the HTML-Tags <br/> for
 * a new line, (<ul>,<ul/>) and (<li>,<li/>) for lists, (<h1>,<h1/>) to (<h6>,<h6/>) for
 * headings and (<b>,</b>) for a bold text are allowed.
 *
 * Texts element with highlight and comment for details on the snowpack structure.
 *
 * Texts element with highlight and comment for travel advisory.
 *
 * Texts element with highlight and comment for weather forecast information.
 *
 * Texts element with highlight and comment for weather review information.
 *
 * Describes the expected tendency of the development of the avalanche situation for a
 * defined time period.
 */
export interface Tendency {
  comment?: string;
  highlights?: string;
  customData?: any;
  metaData?: MetaData;
  tendencyType?: TendencyType;
  validTime?: ValidTime;
}

export type TendencyType = "decreasing" | "increasing" | "steady";

/**
 * Valid time defines two ISO 8601 timestamps in UTC or with time zone information.
 *
 * Date and Time from and until this bulletin is valid. ISO 8601 Timestamp in UTC or with
 * time zone information.
 */
export interface ValidTime {
  endTime?: Date;
  startTime?: Date;
}
