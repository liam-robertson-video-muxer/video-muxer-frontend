export interface Snippet {
    id: number;
    videoStream: ArrayBuffer;
    user: string;
    videoType: string;
    timeStartPos: number;
    timeEndPos: number;
    durationWidth: number;
    upvote: number;
    downvote: number;
    visible: boolean;
}