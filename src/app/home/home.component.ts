import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { Snippet } from '../models/Snippet.model';
import { SnippetOut } from '../models/SnippetOut.model';
import { SnippetPreview } from '../models/SnippetPreview.model';
import { SnippetRaw } from '../models/SnippetRaw.model';
import { DomSanitizer } from '@angular/platform-browser';
import { Tapestry } from '../models/Tapestry.model';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  pausePlay: string = "play_arrow";
  timeMinsSecs: string = "00:00"
  sectionHide: string = "browse"
  volumeHover = false
  interval!: number;
  mousedown!: boolean;
  selectedFile: File | null = null

  snippetList!: Snippet[];
  snippetPool: Snippet[] = []
  activeSnippetList: Snippet[] = []
  sliderContainerRect!: DOMRect;
  previewSliderWidth: number = 0;
  snippetOut!: SnippetOut;
  previewSnippet!: SnippetPreview;
  tapestry!: Tapestry;
  tapestryVidEl!: HTMLVideoElement;
  previewSliderDiv!: HTMLElement;

  constructor( 
    private appService: AppService,
    private sanitizer: DomSanitizer
    ) {} 
   
  ngOnInit(): void { 
    this.setInitialVariables()     
    this.appService.getTapestry().subscribe((tapestry: Blob) => {
      this.tapestry.videoStreamUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(tapestry))

      this.appService.getRawSnippets().subscribe((rawSnippetList: SnippetRaw[]) => {
        this.snippetList = this.RawSnippetToSnippet(rawSnippetList, this.tapestry.videoDiv.duration)
      })
    });  
  }

  updateTimeElements() {
    this.timeMinsSecs = new Date(this.tapestry.videoDiv.currentTime * 1000).toISOString().substring(14, 19)  
    this.tapestry.currentTimePct = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
    const isSnippetActiveCheck = (snippet: Snippet) => this.tapestry.currentTimePct >= snippet.timeStartPos && this.tapestry.currentTimePct <= snippet.timeEndPos
    const isPreviewSnippetActiveCheck = this.tapestry.currentTimePct >= this.previewSnippet.timeStartPos && this.tapestry.currentTimePct <= this.previewSnippet.timeEndPos
    const isSnippetLoaded = this.snippetPool.length > 0 || this.selectedFile != null
    const isSnippetActive = this.snippetPool.some(isSnippetActiveCheck) || isPreviewSnippetActiveCheck
    
    if (isSnippetLoaded) {
      if (isSnippetActive) {
        this.updateActiveSnippetList()
        this.showActiveSnippets()
        this.showActivePreviewSnippets()
        this.tapestry.visible = false
      } else {
        this.tapestry.visible = true 
      }
    } else {
      this.tapestry.visible = true
    }
  }

  mouseDown(event: MouseEvent) {
    this.mousedown = true
    this.jumpToTimeClick(event)
  }

  jumpToTimeClick(mouseClick: MouseEvent) {
    const isSnippetActiveCheck = (snippet: Snippet) => this.tapestry.currentTimePct >= snippet.timeStartPos && this.tapestry.currentTimePct <= snippet.timeEndPos
    const isPreviewSnippetActiveCheck = this.tapestry.currentTimePct >= this.previewSnippet.timeStartPos && this.tapestry.currentTimePct <= this.previewSnippet.timeEndPos
    const isSnippetLoaded = this.snippetPool.length > 0 || this.selectedFile != null
    const isSnippetActive = this.snippetPool.some(isSnippetActiveCheck) || isPreviewSnippetActiveCheck
    
    if (isSnippetLoaded) {
      if (isSnippetActive) {
        this.updateActiveSnippetList()
        this.showHideSnippetsByClick(mouseClick)
        const sliderContainerRect: DOMRect = (document.getElementById("slider-container") as HTMLElement).getBoundingClientRect() as DOMRect;
        this.tapestry.currentTime = ((mouseClick.clientX - sliderContainerRect.left) / sliderContainerRect.width) * this.tapestry.videoDiv.duration;
        this.tapestry.visible = false
      } else {
        this.tapestry.visible = true 
      }
    } else {
      this.tapestry.visible = true
    }
  }

  togglePlayPause() {
    switch (this.pausePlay) {
      case "play_arrow":       
      this.pausePlaySnippet()
      this.tapestry.videoDiv.play();      
      this.pausePlay = "pause"
      break;

      case "pause":  
      this.pausePlaySnippet()
      this.tapestry.videoDiv.pause();
      this.pausePlay = "play_arrow"
      break;
    }
  }

  showHideSnippetsByClick(mouseClick: MouseEvent) {
    this.activeSnippetList.map((snippet: Snippet) => {
      const snippetSliderRect: DOMRect = (document.getElementById("snippet-pool-el-" + snippet.id) as HTMLVideoElement).getBoundingClientRect() as DOMRect
      const mouseClickPosSnippet = ((mouseClick.clientX - snippetSliderRect.left) / snippetSliderRect.width) * 100
      snippet.currentTime = (mouseClickPosSnippet * snippet.videoDiv.duration) / 100;
      snippet.visible = true
      if (!this.tapestry.videoDiv.paused) {
        snippet.videoDiv.play()
      }
    })
  }

  updateActiveSnippetList() {
    const outputList: Snippet[] = []
    this.snippetPool.map((snippet: Snippet) => {
      if (this.tapestry.currentTimePct >= snippet.timeStartPos && this.tapestry.currentTimePct <= snippet.timeEndPos) {
        outputList.push(snippet)
      }
    })
    this.activeSnippetList = outputList
  }

  showActiveSnippets() {
    this.activeSnippetList.map((snippet: Snippet) => {
      snippet.visible = true;
      snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement  
      if (!this.tapestry.videoDiv.paused) {
        snippet.videoDiv.play()
      }
    })
  }

  findActiveSnippets() {
    const outputList: Snippet[] = []
    if (this.snippetPool.length > 0) {
      const isSnippetActiveCheck = (snippet: Snippet) => this.tapestry.currentTimePct >= snippet.timeStartPos && this.tapestry.currentTimePct <= snippet.timeEndPos
      if (this.snippetPool.some(isSnippetActiveCheck)) {
        this.snippetPool.map((snippet: Snippet) => {
          if (this.tapestry.currentTimePct >= snippet.timeStartPos && this.tapestry.currentTimePct <= snippet.timeEndPos) {
            outputList.push(snippet)
          }
        })
      }
    } 
    this.activeSnippetList = outputList
  }

  showActivePreviewSnippets() {
    if (this.previewSnippet.file != null) {
      if (this.tapestry.currentTimePct >= this.previewSnippet.timeStartPos && this.tapestry.currentTimePct <= this.previewSnippet.timeEndPos) {
        this.previewSnippet.visible = true
      } else {
        this.previewSnippet.visible = false
      }
    } 
  }

  loadSnippetToPool(snippet: Snippet) {   
    if (this.snippetPool.includes(snippet)) {
      this.snippetPool = this.snippetPool.filter(currSnippet => currSnippet != snippet)
    } else {
      this.snippetPool.push(snippet)      
      snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement
      this.interval = window.setInterval(() => (this.setSnippetTime(snippet), 1000))
    }
  }

  setSnippetTime(snippet: Snippet) {
    if (document.getElementById("snippet-pool-el-" + snippet.id) != null && document.getElementById("snippet-videoEl-" + snippet.id) != null) {
      const snippetSlider = document.getElementById("snippet-pool-el-" + snippet.id) as HTMLElement
      const tapestryVid = document.getElementById("tapestry-videoEl") as HTMLVideoElement
      snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement
      const snippetTimePos = (((this.tapestry.currentTimePct * tapestryVid.getBoundingClientRect().width) - snippetSlider.getBoundingClientRect().left) / snippetSlider.getBoundingClientRect().width)
      snippet.videoDiv.onloadedmetadata = () => {
        snippet.currentTime = (snippetTimePos * snippet.videoDiv.duration) / 100;
      }
    }
  }

  selectFile() {
    (document.getElementById("selectFile") as HTMLInputElement).click()
  }

  jumpToTime(xPosPcnt: number) {
    this.tapestry.currentTime = (xPosPcnt * this.tapestry.videoDiv.duration) / 100
  }

  

  createSnippetFromFile(event: any) {    
    this.selectedFile = event.target.files[0] as File;
    this.previewSnippet.videoStreamUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(this.selectedFile))

    this.previewSnippet.videoEl.onloadedmetadata = () => {
      this.previewSliderWidth =   (this.previewSnippet.videoEl.duration / this.tapestry.videoDiv.duration) * 100
      this.previewSnippet.sliderRect = (document.getElementById("preview-slider-thumb") as HTMLElement).getBoundingClientRect()
      console.log();
      
      this.previewSnippet = {
        file: this.selectedFile as File,
        videoEl:  document.getElementById("preview-snippet-videoEl") as HTMLVideoElement,
        sliderRect:  (document.getElementById("preview-snippet-videoEl") as HTMLVideoElement).getBoundingClientRect(),
        videoStreamUrl: this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(this.selectedFile as File)),
        user: "liam",
        currentTime: 0,
        videoType: this.selectedFile!.type,
        timeStartPos: ((this.previewSliderDiv.getBoundingClientRect().left - this.previewSnippet.videoEl.getBoundingClientRect().left) / this.previewSnippet.videoEl.getBoundingClientRect().width) * 100,
        timeEndPos: ((this.previewSliderDiv.getBoundingClientRect().right - this.previewSnippet.videoEl.getBoundingClientRect().left) / this.previewSnippet.videoEl.getBoundingClientRect().width) * 100,
        durationWidth: (this.previewSnippet.videoEl.duration / this.tapestry.videoDiv.duration) * 100,
        visible: true,
      }
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

 
  mainSliderDragged(event: MouseEvent) {    
    if (this.mousedown) {
      this.jumpToTimeClick(event)
    }
  }

  previewSliderDrag() {
    this.previewSnippet.timeStartPos = ((this.previewSnippet.sliderRect.left - this.sliderContainerRect.left) / this.sliderContainerRect.width) * 100
    this.previewSnippet.timeEndPos = ((this.previewSnippet.sliderRect.right - this.sliderContainerRect.left) / this.sliderContainerRect.width) * 100
    this.previewSnippet.durationWidth = (this.previewSnippet.sliderRect.width / this.sliderContainerRect.width) * 100
  }

  pausePlaySnippet() {
    this.activeSnippetList.map((snippet: Snippet) => {
      if (this.pausePlay == "play_arrow") {
        snippet.videoDiv.play()
      } else if ((this.pausePlay == "pause")) {
        snippet.videoDiv.pause()
      }
    })
  }

  uploadFile() {
    this.snippetOut = {
      file: this.previewSnippet.file as File,
      user: "liam",
      videoType: this.previewSnippet.videoType,
      timeStart: (this.previewSnippet.timeStartPos / 100) * this.tapestry.videoDiv.duration,
      timeEnd: (this.previewSnippet.timeEndPos / 100) * this.tapestry.videoDiv.duration,
      duration: (this.previewSnippet.durationWidth / 100) * this.tapestry.videoDiv.duration,
  }
    this.appService.uploadFile(this.snippetOut)
  }

  setInitialVariables() {
    this.sectionSelect("browse")
    this.setTapestry()
    this.setPreviewSnippet()
    this.sliderContainerRect = (document.getElementById("slider-container") as HTMLElement).getBoundingClientRect();
    (document.getElementById("main-slider-container") as HTMLInputElement).addEventListener('dragstart', (e) => {
      e.preventDefault()
    })
  }

  setTapestry() {
    this.tapestryVidEl = document.getElementById("tapestry-videoEl") as HTMLVideoElement
    this.tapestry = {
      videoDiv: this.tapestryVidEl,
      currentTime: this.tapestryVidEl.currentTime,
      currentTimePct: (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100,
      videoStreamUrl: "",
      visible: true,
    }
    this.tapestry.videoDiv.onloadedmetadata = () => {
      this.tapestry.currentTimePct = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
    }
  }

  setPreviewSnippet() {
    this.previewSliderDiv = document.getElementById("preview-slider-thumb") as HTMLElement
    this.previewSnippet = {
      file: new File(new Array<Blob>(), "Mock.zip", { type: 'application/zip' }),
      videoEl: document.getElementById("preview-snippet-videoEl") as HTMLVideoElement,
      sliderRect: (document.getElementById("preview-snippet-videoEl") as HTMLVideoElement).getBoundingClientRect(),
      videoStreamUrl: "",
      user: "",
      videoType: "",
      currentTime: 0,
      timeStartPos: 0,
      timeEndPos: 0,
      durationWidth: 0,
      visible: false,
    }
  }

  RawSnippetToSnippet(rawSnippetList: SnippetRaw[], tapestryDuration: number) {
    const snippetList: Snippet[] = []
    rawSnippetList.map((rawSnippet: SnippetRaw) => { 
      const blobPart = new Blob([new Uint8Array(rawSnippet.videoStream)], {type: "application/octet-stream"})
      const binaryData = [];
      binaryData.push(blobPart); 

      const currSnippet: Snippet = {
        id: rawSnippet.id,
        videoDiv: document.getElementById("snippet-videoEl-" + rawSnippet.id) as HTMLVideoElement,
        videoStreamUrl: this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(new Blob(binaryData, {type: "application/octet-stream"}))),
        user: rawSnippet.user,
        timeStartPos: (rawSnippet.timeStart / tapestryDuration) * 100,
        timeEndPos: (rawSnippet.timeEnd / tapestryDuration) * 100,
        durationWidth: (rawSnippet.duration / tapestryDuration) * 100,
        currentTime: 0,
        upvote: rawSnippet.upvote,
        downvote: rawSnippet.downvote,
        visible: false,
      }
      snippetList.push(currSnippet)
    })
    return snippetList
  }
}
