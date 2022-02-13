import { SafeUrl } from "@angular/platform-browser";

export interface SnippetOut {
    videoStream: Blob;
    user: string;
    videoName: string;
    timeStart: number;
    timeEnd: number;
    duration: number;
}