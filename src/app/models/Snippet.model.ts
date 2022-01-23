import { SafeUrl } from "@angular/platform-browser";

export interface Snippet {
    id: number;
    videoDiv: HTMLVideoElement;
    videoStreamUrl: SafeUrl;
    user: string;
    timeStartPos: number;
    timeEndPos: number;
    durationWidth: number;
    currentTime: number;
    upvote: number;
    downvote: number;
    visible: boolean;
}