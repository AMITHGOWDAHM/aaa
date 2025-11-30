export interface DatasetRow {
  [key: string]: any;
}

export interface QualityMetrics {
  totalRows: number;
  totalColumns: number;
  completeness: number;
  duplicates: number;
  missingValues: {
    [column: string]: number;
  };
  dataTypes: {
    [column: string]: string;
  };
  uniqueValues: {
    [column: string]: number;
  };
  outliers: {
    [column: string]: number;
  };
}

export interface AIInsight {
  category: 'critical' | 'warning' | 'suggestion';
  message: string;
  column?: string;
  recommendation?: string;
}

export interface QualityReport {
  metrics: QualityMetrics;
  insights: AIInsight[];
  overallScore: number;
  timestamp: string;
}