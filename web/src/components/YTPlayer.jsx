import { h, Component } from 'preact';

class YouTubeVideo extends Component {

  componentDidMount = () => {
    // On mount, check to see if the API script is already loaded

    if (!window.YT) { // If not, load the script asynchronously TS-ignore
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';

      // onYouTubeIframeAPIReady will load the video after the script is loaded
      window.onYouTubeIframeAPIReady = this.loadVideo;

      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    } else { // If script is already there, load the video directly
      this.loadVideo();
    }
  };

  componentDidUpdate = (newProps) => {
    if (newProps.id !== this.id) {
        const oldEl = document.getElementById(`youtube-player-${this.id}`);
        if (oldEl) oldEl.parentElement.removeChild(oldEl);
        if (window.YT) this.loadVideo();
    }
  }

  loadVideo = () => {
    const { id } = this.props;
    this.id = id;
    console.log('YT: ', id);
    // the Player object is created uniquely based on the id in props
    this.player = new window.YT.Player(`youtube-player-${id}`, {
      videoId: id,
      host: "https://www.youtube-nocookie.com",
      events: {
        onReady: this.onPlayerReady,
        onError: (e) => console.log(e),
      },
    });
  };

  onPlayerReady = event => {
    this.props.getPlayer?.(event.target);
  };

  render = () => {
      const { id } = this.props;
    return (
      <div>
        <div id={`youtube-player-${id}`} />
      </div>
    );
  };
}

export default YouTubeVideo;