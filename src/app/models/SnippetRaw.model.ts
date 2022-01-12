export interface SnippetRaw {
    id: number;
    videoStream: ArrayBuffer;
    user: string;
    videoType: string;
    timeStart: number;
    timeEnd: number;
    duration: number;
    upvote: number;
    downvote: number;
 }