import { CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppService } from '../app.service';
import { Snippet } from '../models/Snippet.model';
import { SnippetOut } from '../models/SnippetOut.model';
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
  sectionHide: string = "browse"
  snippetList!: Snippet[];
  snippetPool: Snippet[] = []
  hideSnippetVidEl: boolean = false;
  previewSnippet!: SnippetPreview;
  previewSnippetStartTime: number = 0;
  hidePreviewVidEl: boolean = true;
  sliderContainer!: HTMLElement;
  previewSliderThumb!: HTMLInputElement;
  tapestryVidEl!: HTMLVideoElement;     
  snippetVidEl!: HTMLVideoElement;   
  tapestryCurrentTime: number = 0
  currentSliderXpcnt: number = 0
  mainSliderXpcnt: number = 0
  mousedown!: boolean;
  mainSliderContainer!: HTMLInputElement;
  snippetOut!: SnippetOut;
  selectedFile!: File;
  loading: boolean = true
 
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
    this.tapestryVidEl.onloadedmetadata = () => {
      this.snippetVidEl.onloadedmetadata = () => {
        this.loading = false
      }
    }
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
    const mainSlider = document.getElementById("main-slider") as HTMLInputElement
    this.mainSliderContainer = document.getElementById("main-slider-container") as HTMLInputElement
    this.mainSliderContainer.addEventListener('dragstart', (e) => {
      e.preventDefault()
    })
    mainSlider.style.width = ((this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100).toString() + "%"
    this.previewSnippet = {
      file: new File(new Array<Blob>(), "Mock.zip", { type: 'application/zip' }),
      videostreamUrl: "",
      user: "",
      videoType: "",
      timeStartPos: 0,
      timeEndPos: 0,
      durationWidth: 0,
    }
  }

  createSnippetFromFile(event: any) {
    this.selectedFile = event.target.files[0];   
    this.snippetVidEl.src = window.URL.createObjectURL(this.selectedFile);
    this.snippetVidEl.muted = true
    this.snippetVidEl.onloadedmetadata = () => {
      
      this.previewSnippet.durationWidth = (this.snippetVidEl.duration / this.tapestryVidEl.duration) * 100
      const previewSliderRect = this.previewSliderThumb.getBoundingClientRect()
      const sliderContainerRect = this.sliderContainer.getBoundingClientRect()

      this.previewSnippet = {
        file: this.selectedFile,
        videostreamUrl: window.URL.createObjectURL(this.selectedFile),
        user: "liam",
        videoType: this.selectedFile.type,
        timeStartPos: ((previewSliderRect.left - sliderContainerRect.left) / sliderContainerRect.width) * 100,
        timeEndPos: ((previewSliderRect.right - sliderContainerRect.left) / sliderContainerRect.width) * 100,
        durationWidth: (this.snippetVidEl.duration / this.tapestryVidEl.duration) * 100,
      }
    }
    
  }

  updateTimeElements() {
    const fileSelectorDiv = document.getElementById("selectFile") as HTMLInputElement
    const tapestryTimePcnt = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
    if (this.snippetPool.length > 0) {
      this.snippetPool.map(snippet => {
        if (tapestryTimePcnt >= snippet.timeStartPos && tapestryTimePcnt <= snippet.timeEndPos) {
          this.setVideoSrc(snippet.videoStream, "snippet-videoEl")
          this.hideSnippetVidEl = false
        }
      })
    } else if (fileSelectorDiv.value != '') {
      if (tapestryTimePcnt >= this.previewSnippet.timeStartPos && tapestryTimePcnt <= this.previewSnippet.timeEndPos) {
        this.snippetVidEl.src = (this.previewSnippet.videostreamUrl, "snippet-videoEl")
        this.hideSnippetVidEl = false
      }
    } else {
      this.hideSnippetVidEl = true
    }
    
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

  previewSliderDrag() {
    const previewSliderRect = this.previewSliderThumb.getBoundingClientRect()
    const sliderContainerRect = this.sliderContainer.getBoundingClientRect()

    this.previewSnippet.timeStartPos = ((previewSliderRect.left - sliderContainerRect.left) / sliderContainerRect.width) * 100
    this.previewSnippet.timeEndPos = ((previewSliderRect.right - sliderContainerRect.left) / sliderContainerRect.width) * 100
    this.previewSnippet.durationWidth = (previewSliderRect.width / sliderContainerRect.width) * 100    
  }

  selectFile() {
    (document.getElementById("selectFile") as HTMLInputElement).click()
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

  mouseDown(event: MouseEvent) {
    this.mousedown = true
    this.jumpToTimeClick(event)
  }

  mainSliderDragged(event: MouseEvent) {    
    if (this.mousedown) {
      this.jumpToTimeClick(event)
    }

    // const sliderContainerRect = this.sliderContainer.getBoundingClientRect()
    // const sliderContainerWidth = sliderContainerRect.right - sliderContainerRect.left
    // const sliderThumbRect = this.previewSliderThumb.getBoundingClientRect()        
    // this.sliderThumbPcntX = ((sliderThumbRect.left - sliderContainerRect.left) / sliderContainerWidth) * 100    
    // this.tapestryCurrentTime = this.sliderThumbPcntX * this.tapestryVidEl.duration / 100    
  }

  uploadFile() {
    this.snippetOut = {
      file: this.previewSnippet.file,
      user: "liam",
      videoType: this.previewSnippet.videoType,
      timeStart: (this.previewSnippet.timeStartPos / 100) * this.tapestryVidEl.duration,
      timeEnd: (this.previewSnippet.timeEndPos / 100) * this.tapestryVidEl.duration,
      duration: (this.previewSnippet.durationWidth / 100) * this.tapestryVidEl.duration,
  }
    this.appService.uploadFile(this.snippetOut)
    
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
