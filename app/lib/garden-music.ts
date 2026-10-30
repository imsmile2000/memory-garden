// Original, locally synthesized piano-like ambience. No downloaded audio or network requests.
export function createGardenMusic(){
 const context=new AudioContext(),master=context.createGain(),filter=context.createBiquadFilter(),delay=context.createDelay(1),feedback=context.createGain(),wet=context.createGain();
 filter.type='lowpass';filter.frequency.value=1700;master.gain.value=0;delay.delayTime.value=.38;feedback.gain.value=.16;wet.gain.value=.15;
 filter.connect(master);filter.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(master);master.connect(context.destination);
 let playing=false,disposed=false,index=0,nextAt=0,timer:ReturnType<typeof setInterval>|undefined,suspendTimer:ReturnType<typeof setTimeout>|undefined;
 const chords=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,67]],pattern=[0,2,1,3,2,1,0,2];
 function note(midi:number,at:number,volume:number,duration=3.8){
  const frequency=440*2**((midi-69)/12);
  for(const [multiple,strength]of [[1,1],[2,.18],[3,.05]]){
   const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency*multiple;
   envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(volume*strength,at+.035);envelope.gain.exponentialRampToValueAtTime(.0001,at+duration);
   oscillator.connect(envelope);envelope.connect(filter);oscillator.start(at);oscillator.stop(at+duration+.05);oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
  }
 }
 function schedule(){if(!playing||disposed||document.hidden)return;if(nextAt<context.currentTime+.02)nextAt=context.currentTime+.02;while(nextAt<context.currentTime+1.2){const chord=chords[Math.floor(index/8)%chords.length];note(chord[pattern[index%8]],nextAt,.075);if(index%8===0)note(chord[0]-12,nextAt,.04,5.5);index++;nextAt+=.94;}}
 function run(){if(timer)clearInterval(timer);schedule();timer=setInterval(schedule,400);}
 const visibility=()=>{if(document.hidden){if(timer)clearInterval(timer);timer=undefined;void context.suspend();}else if(playing){void context.resume().then(run);}};
 document.addEventListener('visibilitychange',visibility);
 return{
  async start(){if(disposed)return;if(suspendTimer)clearTimeout(suspendTimer);playing=true;await context.resume();master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(.55,context.currentTime,.5);run();},
  stop(){playing=false;if(timer)clearInterval(timer);timer=undefined;master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(0,context.currentTime,.2);suspendTimer=setTimeout(()=>{if(!playing)void context.suspend();},900);},
  dispose(){disposed=true;playing=false;if(timer)clearInterval(timer);if(suspendTimer)clearTimeout(suspendTimer);document.removeEventListener('visibilitychange',visibility);void context.close();}
 };
}
