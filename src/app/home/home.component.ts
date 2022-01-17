import { CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppService } from '../app.service';
import { Snippet } from '../models/Snippet.model';
import { SnippetPreview } from '../models/SnippetPreview.model';
import { SnippetRaw } from '../models/SnippetRaw.model';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  pausePlay: string = "play_arrow";
  timeMinsSecs: string = "00:00"
  juiceWidth: number = 0;
  tapestryVidEl!: HTMLVideoElement;     
  snippetVidEl!: HTMLVideoElement;     
  snippetVideo!: HTMLVideoElement;
  snippetStartPx: number = 0;
  snippetEndPx!: number;
  snippetStartTime!: number;
  snippetEndTime!: number;
  pxPerSecondConversion!: number;
  barWidthPx!: number;
  orangeBarPos!: number;
  snippetWidthPx!: number;
  sectionHide: string = "browse"
  snippetList!: Snippet[];
  selectedSnippetList: Snippet[] = []
  previewSnippetOn: boolean = false;
  value = 0;
  showSnippetVideo: boolean = false;
  snippetPool: Snippet[] = []
  hideSnippetVidEl: boolean = false;
  previewSnippet!: SnippetPreview;
  previewSnippetStartTime: number = 0;
  hidePreviewVidEl: boolean = true;
  sliderContainer!: HTMLElement;
  previewSliderThumb!: HTMLInputElement;
  mainSliderThumb!: HTMLInputElement;
  sliderThumbPcntX!: number;
  tapestryCurrentTime: number = 0
  username!: Event;
  currentSliderXpcnt: number = 0
  mainSliderXpcnt: number = 0

  @Input()  currentTime!: number | string;
  @Output() currentTimeChange = new EventEmitter<number>();

  constructor(
    private appService: AppService
    ) {}
  
  ngOnInit(): void {
    this.setInitialVariables()    
    this.appService.getTapestry().subscribe(tapestry => {
      this.setVideoSrc(tapestry.videoStream, "tapestry-videoEl")

      this.appService.getRawSnippets().subscribe((rawSnippetList: SnippetRaw[]) => {        
        this.snippetList = this.refineRawSnippets(rawSnippetList, tapestry.duration)
      })
    });  

  }

  refineRawSnippets(rawSnippetList: SnippetRaw[], tapestryDuration: number) {
    const snippetList: Snippet[] = []
    rawSnippetList.map((rawSnippet: SnippetRaw) => {      
      const currSnippet: Snippet = {
        id: rawSnippet.id,
        videoStream: rawSnippet.videoStream,
        user: rawSnippet.user,
        videoType: rawSnippet.videoType,
        timeStartPos: (rawSnippet.timeStart / tapestryDuration) * 100,
        timeEndPos: (rawSnippet.timeEnd / tapestryDuration) * 100,
        durationWidth: (rawSnippet.duration / tapestryDuration) * 100,
        upvote: rawSnippet.upvote,
        downvote: rawSnippet.downvote,
        visible: true,
      }
      snippetList.push(currSnippet)
    })
    return snippetList
  }

  setInitialVariables() {
    this.sectionSelect("browse")
    this.tapestryVidEl = document.getElementById("tapestry-videoEl") as HTMLVideoElement; 
    this.snippetVidEl = document.getElementById("snippet-videoEl") as HTMLVideoElement; 
    this.sliderContainer = document.getElementById("slider-container") as HTMLElement
    this.previewSliderThumb = document.getElementById("preview-slider-thumb") as HTMLInputElement
    this.mainSliderThumb = document.getElementById("main-slider-thumb") as HTMLInputElement
    this.previewSnippet = {
      file: undefined,
      videoStreamUrl: "",
      user: "",
      videoType: "",
      timeStartPos: 0,
      timeEndPos: 0,
      durationWidth: 0,
    }
  }

  createSnippetFromFile(event: any) {
    const selectedFile: File = event.target.files[0];   
    const snippetVideoElement = document.getElementById("snippet-videoEl") as HTMLVideoElement;
    const tapesetryVideoElement = document.getElementById("tapestry-videoEl") as HTMLVideoElement;
    snippetVideoElement.src = window.URL.createObjectURL(selectedFile);
    snippetVideoElement.muted = true
    snippetVideoElement.onloadedmetadata = () => {
      this.hideSnippetVidEl = false
      this.previewSnippet = {
        file: selectedFile,
        videoStreamUrl: window.URL.createObjectURL(selectedFile),
        user: "liam",
        videoType: selectedFile.type,
        timeStartPos: (this.previewSnippetStartTime / tapesetryVideoElement.duration) * 100,
        timeEndPos: ((this.previewSnippetStartTime + snippetVideoElement.duration) / tapesetryVideoElement.duration) * 100,
        durationWidth: (snippetVideoElement.duration  / tapesetryVideoElement.duration) * 100,
      }
      this.hidePreviewVidEl = false
      console.log(this.previewSnippet);
      
    }; 
  }

  updateTimeElements() {
    this.snippetPool.map(snippet => {
      const tapestryTimePcnt = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
      if (tapestryTimePcnt >= snippet.timeStartPos && tapestryTimePcnt <= snippet.timeStartPos) {
        this.setVideoSrc(snippet.videoStream, "snippet-videoEl")
        this.hideSnippetVidEl = false
      }
    })
    
    this.mainSliderXpcnt += 100 / this.tapestryVidEl.duration
    this.timeMinsSecs = this.timeConversion(this.tapestryVidEl.currentTime)
  }

    
  // User triggered events
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  loadSnippetToPool(snippet: Snippet) {   
    if (this.snippetPool.includes(snippet)) {
      this.snippetPool = this.snippetPool.filter(currSnippet => currSnippet != snippet)
    } else {
      this.snippetPool.push(snippet)
      this.hideSnippetVidEl = false
      this.setVideoSrc(snippet.videoStream, "snippet-videoEl")
      this.jumpToTime(snippet.timeStartPos)    
    }
  }

  jumpToTime(xPosPcnt: number) {
    this.tapestryVidEl.currentTime = (xPosPcnt * this.tapestryVidEl.duration) / 100
  }

  jumpToTimeClick(event: MouseEvent) {
    const sliderContainerDiv = document.getElementById("slider-container") as HTMLElement;
    const sliderContainerWidth = sliderContainerDiv.getBoundingClientRect().width
    const mouseClickPos = event.clientX - sliderContainerDiv.getBoundingClientRect().left    
    this.tapestryVidEl.currentTime = (mouseClickPos / sliderContainerWidth) * this.tapestryVidEl.duration;
  }

  togglePlayPause() {   
    if (this.pausePlay == "play_arrow") {
      this.tapestryVidEl.play();
      this.pausePlay = "pause"
    } else {
      this.tapestryVidEl.pause();
      this.pausePlay = "play_arrow"
    }
  }

  sectionSelect(sectionName: string) {
    const sectionNames: string[] = ["upload", "browse", "comments"]
    this.sectionHide = sectionName
    sectionNames.map(currentSection => {
      const currentButton: HTMLElement = document.getElementById(currentSection + "-button") as HTMLElement
      if (sectionName == currentSection) {
        currentButton.style.backgroundColor = "rgba(173, 173, 173, 0.63)"
      } else {
        currentButton.style.backgroundColor = "rgba(230, 230, 230, 0.63)"
      }
    })
  }

  dragMoved(event: CdkDragMove) {
    const sliderContainerRect = this.sliderContainer.getBoundingClientRect()
    const sliderContainerWidth = sliderContainerRect.right - sliderContainerRect.left
    const sliderThumbRect = this.previewSliderThumb.getBoundingClientRect()        
    this.sliderThumbPcntX = ((sliderThumbRect.left - sliderContainerRect.left) / sliderContainerWidth) * 100    
    this.tapestryCurrentTime = this.sliderThumbPcntX * this.tapestryVidEl.duration / 100    
  }


  // Tools
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  setVideoSrc(videoStream: ArrayBuffer, videoElementId: string) {
    const videoDiv = document.getElementById(videoElementId) as HTMLVideoElement;
    const blobPart = new Blob([new Uint8Array(videoStream)], {type: "application/octet-stream"})
    const binaryData = [];
    binaryData.push(blobPart);
    videoDiv.src = window.URL.createObjectURL(new Blob(binaryData, {type: "application/octet-stream"}));
  }

  getCurrentTime() {
    const currentTime = this.currentSliderXpcnt
    return currentTime
  }

  timeConversion(time: number) {
    const rounded: number = Math.round(time)
    const timeMins: number = Math.floor(rounded / 60)
    const timeMinSecs = `${timeMins} : ${rounded - (timeMins * 60)}`
    return timeMinSecs
  }  
  
}



// (cdkDragStarted)="dragStarted($event)"
// (cdkDragEnded)="dragEnded($event)"
// (cdkDragMoved)="dragMoved($event)"
// dragStarted(event: CdkDragStart) {
// dragEnded(event: CdkDragEnd) {
// dragMoved(event: CdkDragMove) {
