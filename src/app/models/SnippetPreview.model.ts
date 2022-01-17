export interface SnippetPreview {
    file: File | undefined;
    videoStreamUrl: string;
    user: string;
    videoType: string;
    timeStartPos: number;
    timeEndPos: number;
    durationWidth: number;
}