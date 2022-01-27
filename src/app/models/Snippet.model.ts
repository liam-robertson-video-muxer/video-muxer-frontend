import { SafeUrl } from "@angular/platform-browser";

export interface Snippet {
    id: number;
    videoDiv: HTMLVideoElement;
    videoStream: Blob;
    user: string;
    timeStartPct: number;
    timeEndPct: number;
    durationPct: number;
    currentTime: number;
    upvote: number;
    downvote: number;
    visible: boolean;
}