import { SafeUrl } from "@angular/platform-browser";

export interface SnippetOut {
    videoStream: SafeUrl;
    user: string;
    videoType: string;
    timeStart: number;
    timeEnd: number;
    duration: number;
}