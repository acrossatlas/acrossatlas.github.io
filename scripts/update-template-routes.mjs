import fs from 'node:fs';
const anchors=[[-74.006,40.714],[-73.998,40.737],[-73.978,40.756],[-73.965,40.777]];
const output={retrievedAt:new Date().toISOString().slice(0,10),anchors,profiles:{}};
for(const profile of ['car','foot']) {
 const url=`https://routing.openstreetmap.de/routed-${profile}/route/v1/driving/${anchors.map(p=>p.join(',')).join(';')}?overview=full&geometries=geojson&steps=true`;
 const response=await fetch(url);if(!response.ok)throw new Error(`HTTP ${response.status}`);
 const data=await response.json();if(data.code!=='Ok')throw new Error(data.code);
 output.profiles[profile]={source:url,waypoints:data.waypoints.map(x=>x.location),legs:data.routes[0].legs.map(leg=>({distanceMeters:leg.distance,durationSeconds:leg.duration,geometry:{type:'LineString',coordinates:leg.steps.flatMap(step=>step.geometry.coordinates).filter((p,i,a)=>!i||p[0]!==a[i-1][0]||p[1]!==a[i-1][1])}}))};
 console.log(profile,output.profiles[profile].legs.map(l=>l.geometry.coordinates.length));
}
fs.writeFileSync('src/data/template-new-york-routes.json',JSON.stringify(output)+'\n');
