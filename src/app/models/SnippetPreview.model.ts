import { SafeUrl } from "@angular/platform-browser";

export interface SnippetPreview {
    file: File;
    videoEl: HTMLVideoElement;
    videoStreamUrl: SafeUrl;
    user: string;
    videoType: string;
    currentTime: number;
    timeStartPos: number;
    timeEndPos: number;
    durationWidth: number;
    visible: boolean,
}