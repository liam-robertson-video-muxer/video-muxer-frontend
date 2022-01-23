import { SafeUrl } from "@angular/platform-browser";

export interface Tapestry {
    videoDiv: HTMLVideoElement;
    videoStreamUrl: SafeUrl;
    visible: boolean;
}