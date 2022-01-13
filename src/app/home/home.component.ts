import { CdkDragMove } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { Snippet } from '../models/Snippet.model';
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

  dragging(event: DragEvent) {
    alert("dfdfssa");
  }

  setInitialVariables() {
    this.sectionSelect("browse")
    this.tapestryVidEl = document.getElementById("tapestry-videoEl") as HTMLVideoElement; 
    this.snippetVidEl = document.getElementById("snippet-videoEl") as HTMLVideoElement; 
  }

  createSnippetFromFile(event: any) {
    const selectedFile = event.target.files[0];   
    this.snippetVideo = document.getElementById("snippet-video") as HTMLVideoElement;
    this.snippetVideo.muted = true
    this.previewSnippetOn = true
    this.createSnippet(selectedFile)
  }

  updateTimeElements(){
    this.snippetPool.map(snippet => {
      const tapestryTimePcnt = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
      if (tapestryTimePcnt >= snippet.timeStartPos && tapestryTimePcnt <= snippet.timeStartPos) {
        this.setVideoSrc(snippet.videoStream, "snippet-videoEl")
        this.hideSnippetVidEl = false
      }
    })
    
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

  jumpToTimeClick(xPos: number) {
    const orangeBarEl = document.getElementById("main-slider") as HTMLElement;
    const startXCoord = orangeBarEl.getBoundingClientRect().left
    const endXCoord = orangeBarEl.getBoundingClientRect().right - startXCoord
    const currentXCoord = xPos - startXCoord
    const widthClickPercent =  (currentXCoord / endXCoord);
  
    this.tapestryVidEl.currentTime = widthClickPercent * this.tapestryVidEl.duration;
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

  createSnippet(selectedFile: File) {
    this.snippetVideo.style.display = "initial"
    this.snippetVideo.src = window.URL.createObjectURL(selectedFile);
    this.snippetVideo.onloadedmetadata = () => {
      const snippetSlider = document.getElementById("snippet-moving-slider") as HTMLElement;
      snippetSlider.style.width = ((this.snippetVideo.duration / this.tapestryVidEl.duration) * 100).toString() + "%"
      this.snippetEndPx = this.snippetVideo.duration * this.pxPerSecondConversion
    };    
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


  // Tools
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  setVideoSrc(videoStream: ArrayBuffer, videoElementId: string) {
    const videoDiv = document.getElementById(videoElementId) as HTMLVideoElement;
    const blobPart = new Blob([new Uint8Array(videoStream)], {type: "application/octet-stream"})
    const binaryData = [];
    binaryData.push(blobPart);
    videoDiv.src = window.URL.createObjectURL(new Blob(binaryData, {type: "application/octet-stream"}));
  }

  timeConversion(time: number) {
    const rounded: number = Math.round(time)
    const timeMins: number = Math.floor(rounded / 60)
    const timeMinSecs = `${timeMins} : ${rounded - (timeMins * 60)}`
    return timeMinSecs
  }  
}
