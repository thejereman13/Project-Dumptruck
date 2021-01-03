import { h, Component } from "preact";
import { RegisterNotification } from "./Notification";

export interface YouTubeVideoProps {
    className: string;
    id: string;
    playerMount: () => void;
    playerError: () => void;
    playerReady: () => void;
}

enum SynchronizationState {
    Reset,
    Playing,
    Paused,
    Finished
}

export class YouTubeVideo extends Component<YouTubeVideoProps> {
    constructor(props: any) {
        super(props);
        this.YTLoaded = false;
        this.playerMounted = false;
        this.synchronizationState = SynchronizationState.Reset;
        this.player = undefined;
    }

    YTLoaded: boolean;
    playerMounted: boolean;
    id: string | undefined;
    player: YT.Player | undefined;
    synchronizationState: SynchronizationState;

    setVolume(level: number): number {
        if (!this.player || !this.playerMounted) return 0;
        const val = Math.max(0, Math.min(level, 100));
        this.player.setVolume(val);
        return val;
    }
    getVolume(): number {
        if (!this.player || !this.playerMounted) return 0;
        return this.player.getVolume();
    }

    synchronizeYoutube(videoTime: number, playing: boolean): void {
        if (!this.player || !this.playerMounted) return;
        // console.log("Sync", videoTime, playing, new Date().toUTCString());
        switch (this.synchronizationState) {
            case SynchronizationState.Reset:
                if (playing) {
                    this.synchronizationState = SynchronizationState.Playing;
                    this.synchronizeYoutube(videoTime, playing);
                } else {
                    this.player.stopVideo();
                }
                break;
            case SynchronizationState.Playing:
                if (Math.abs(this.player.getCurrentTime() - videoTime) > 1) {
                    this.player.seekTo(videoTime, true);
                }
                if (this.player.getPlayerState() === 0) {
                    this.synchronizationState = SynchronizationState.Finished;
                } else if (this.player.getPlayerState() !== 1) {
                    this.player.playVideo();
                }
                if (!playing) {
                    this.synchronizationState = SynchronizationState.Paused;
                    this.synchronizeYoutube(videoTime, playing);
                }
                break;
            case SynchronizationState.Paused:
                if (Math.abs(this.player.getCurrentTime() - videoTime) > 1) {
                    this.player.seekTo(videoTime, true);
                }
                if (this.player.getPlayerState() !== 2) {
                    this.player.pauseVideo();
                }
                if (playing) {
                    this.synchronizationState = SynchronizationState.Playing;
                    this.synchronizeYoutube(videoTime, playing);
                }
                break;
            case SynchronizationState.Finished:
                if (playing) {
                    this.synchronizationState = SynchronizationState.Playing;
                    this.synchronizeYoutube(videoTime, playing);
                }
                break;
        }
    }

    componentDidMount = (): void => {
        // On mount, check to see if the API script is already loaded
        if (!window.YT) {
            // If not, load the script asynchronously TS-ignore
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";

            // onYouTubeIframeAPIReady will load the video after the script is loaded
            // @ts-ignore
            window.onYouTubeIframeAPIReady = this.scriptLoaded;

            const firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        } else {
            // If script is already there, load the video directly
            this.YTLoaded = true;
            this.loadVideo();
        }
    };

    componentDidUpdate = (newProps: YouTubeVideoProps): void => {
        if (newProps.id !== this.id) {
            const oldEl = document.getElementById(`youtube-player-${this.id}`);
            if (oldEl) oldEl?.parentElement?.removeChild(oldEl);
            if (window.YT) this.loadVideo();
        }
    };

    scriptLoaded = (): void => {
        this.YTLoaded = true;
        this.loadVideo();
    };

    loadVideo = (): void => {
        const { id, playerError } = this.props;
        this.id = id;
        if (!this.YTLoaded) return;

        if (!this.playerMounted && id) {
            this.player = new window.YT.Player(`youtube-player`, {
                host: "https://www.youtube-nocookie.com",
                videoId: id,
                events: {
                    onReady: this.onPlayerReady,
                    onError: (e): void => {
                        console.warn("Youtube Error:", e);
                        RegisterNotification("Youtube Player Encountered Error", "error");
                        playerError();
                    }
                    // onStateChange: (e): void => this.onPlayerStateChange(e.data)
                },
                playerVars: {
                    fs: 1,
                    disablekb: 1,
                    playsinline: 1,
                    origin: "https://www.youtube.com"
                }
            });
        } else {
            if (!id) {
                this.player?.destroy();
                this.playerMounted = false;
            } else {
                this.player?.loadVideoById(id);
                this.player?.pauseVideo();
            }
        }
    };

    onPlayerReady = (): void => {
        this.playerMounted = true;
        this.props.playerMount();
    };

    // Temporarily abandoned due to difficulties determining the correct loading state.
    // lastState = -4;
    // onPlayerStateChange = (state: number): void => {
    //     // Once the player finishes buffering or becomes queued, it is ready
    //     if ((this.lastState === 3 && state !== 3) || (this.lastState !== 5 && state === 5)) {
    //         this.props.playerReady();
    //     }
    //     this.lastState = state;
    // };

    render = (): JSX.Element => {
        const { className } = this.props;
        return (
            <div class={className}>
                <div id={`youtube-player`} />
            </div>
        );
    };
}
