export interface Snippet {
    id: number;
    videoStream: ArrayBuffer;
    user: string;
    videoType: string;
    timeStart: number;
    timeEnd: number;
    upvote: number;
    downvote: number;
 }