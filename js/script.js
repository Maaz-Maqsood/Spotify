console.log("Lets write JavaScript");

let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;
  try {
    let response = await fetch(`/${folder}/`);
    if (!response.ok) throw new Error("Network response was not ok.");
    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
      const element = as[index];
      if (element.href.endsWith(".mp3")) {
        songs.push(element.href.split(`/${folder}/`)[1]);
      }
    }

    let songUl = document
      .querySelector(".songList")
      .getElementsByTagName("ul")[0];
    songUl.innerHTML = "";

    for (const song of songs) {
      songUl.innerHTML += `
        <li>
          <img class="invert" src="images/music.svg" alt="">
          <div class="info">
            <div class="songname">${decodeURI(song.replace(/%20/g, " "))}</div>
            <div class="artist">HARRY</div>
          </div>
          <div class="playnow">
            <span>Play now</span>
            <img class="invert" src="images/play.svg" alt="">
          </div>
        </li>`;
    }

    Array.from(
      document.querySelector(".songList").getElementsByTagName("li")
    ).forEach((e) => {
      e.addEventListener("click", () => {
        playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
      });
    });

    return songs;
  } catch (error) {
    console.error("Failed to get songs:", error);
  }
}

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + track;
  console.log(currentSong.src);
  if (!pause) {
    currentSong.play();
    document.querySelector("#play").src = "images/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
  console.log("displaying albums");
  let a = await fetch(`/songs/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");
  let array = Array.from(anchors);
  for (let index = 0; index < array.length; index++) {
    const e = array[index];
    if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
      let folder = e.href.split("/").slice(-2)[0];
      // Get the metadata of the folder
      let a = await fetch(`/songs/${folder}/info.json`);
      let response = await a.json();
      cardContainer.innerHTML =
        cardContainer.innerHTML +
        ` <div data-folder="${folder}" class="card">
          <div class="play">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                      stroke-linejoin="round" />
              </svg>
          </div>

          <img src="/songs/${folder}/cover.jpg" alt="">
          <h2>${response.title}</h2>
          <p>${response.description}</p>
      </div>`;
    }
  }

  // Load the playlist whenever card is clicked
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      console.log("Fetching Songs");
      songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
      playMusic(songs[0]);
    });
  });
}

async function main() {
  // All songs lists
  await getSongs("songs/myfavourite");

  // Display all the albums on the page
  await displayAlbums();

  // Attach an event listener to play/pause button
  document.querySelector("#play").addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      document.querySelector("#play").src = "images/pause.svg";
    } else {
      currentSong.pause();
      document.querySelector("#play").src = "images/play.svg";
    }
  });

  // Listen for timeupdate function
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `
      ${secondsToMinutesSeconds(currentSong.currentTime)} / 
      ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Add an event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Add an event listener for hamburger menu
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  // Add an event listener for closing left menu
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-125%";
  });

  // Add an event listener for previous song
  document.querySelector("#previous").addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").pop());
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  // Add an event listener for next song
  document.querySelector("#next").addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").pop());
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Add an event for volume
  document.querySelector(".range input").addEventListener("input", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (currentSong.paused) {
        currentSong.play();
        document.querySelector("#play").src = "images/pause.svg";
      } else {
        currentSong.pause();
        document.querySelector("#play").src = "images/play.svg";
      }
    }
  });

  document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("images/volume.svg")) {
      e.target.src = e.target.src.replace(
        "images/volume.svg",
        "images/mute.svg"
      );
      currentSong.volume = 0;
      document.querySelector(".range input").value = 0;
    } else {
      e.target.src = e.target.src.replace(
        "images/mute.svg",
        "images/volume.svg"
      );
      currentSong.volume = 0.1;
      document.querySelector(".range input").value = 10;
    }
  });
}

main();
