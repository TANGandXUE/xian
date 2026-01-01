import { StringDimensions } from "@/entities/string-data/model";

export function getBaseColor(dimensions: StringDimensions): string {
    const r = Math.round(dimensions.empathy * 255);
    const g = Math.round(dimensions.pleasure * 255);
    const b = Math.round(dimensions.cognition * 255);
    return `rgb(${r}, ${g}, ${b})`;
}
