import { SafeUrl } from "@angular/platform-browser";

export interface Snippet {
    id: number;
    videoStreamUrl: SafeUrl;
    user: string;
    videoType: string;
    timeStartPos: number;
    timeEndPos: number;
    durationWidth: number;
    currentTime: number;
    upvote: number;
    downvote: number;
    visible: boolean;
}