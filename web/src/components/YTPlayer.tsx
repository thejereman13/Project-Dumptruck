import { h, Component } from "preact";

export interface YouTubeVideoProps {
    className: string;
    id: string;
    playerMount: () => void;
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

    synchronizeYoutube(videoTime: number, playing: boolean): void {
        if (!this.player || !this.playerMounted) return;
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
        const { id } = this.props;
        this.id = id;
        console.log("YT: ", id);
        if (!id || !this.YTLoaded) return;

        // the Player object is created uniquely based on the id in props
        this.player = new window.YT.Player(`youtube-player-${id}`, {
            videoId: id,
            host: "https://www.youtube-nocookie.com",
            events: {
                onReady: this.onPlayerReady,
                onError: (e): void => {
                    console.warn("Youtube Error:", e);
                    this.loadVideo();
                }
            },
            playerVars: {
                fs: 0,
                origin: "https://www.youtube.com"
            }
        });
    };

    onPlayerReady = (): void => {
        this.playerMounted = true;
        this.props.playerMount();
    };

    render = (): JSX.Element => {
        const { id, className } = this.props;
        return (
            <div class={className}>
                <div id={`youtube-player-${id}`} />
            </div>
        );
    };
}
