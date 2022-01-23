import { SafeUrl } from "@angular/platform-browser";

export interface Tapestry {
    videoDiv: HTMLVideoElement;
    videoStreamUrl: SafeUrl;
    currentTime: number;
    currentTimePct: number;
    visible: boolean;
}