export type DimensionType = 'cognition' | 'empathy' | 'pleasure';

export interface StringDimensions {
    cognition: number; // 0-1, Blue
    empathy: number;   // 0-1, Red
    pleasure: number;  // 0-1, Green
}

export interface UserStringData {
    userId: string;
    name: string;
    dimensions: StringDimensions;
}
