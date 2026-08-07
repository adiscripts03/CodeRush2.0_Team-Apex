import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import { db } from './lib/supabase'

delete (L.Icon.Default.prototype as unknown as Record<string,unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl:'', shadowUrl:'', iconRetinaUrl:'' })

// ─── Constants ────────────────────────────────────────────────────────────────
const CENTER: [number,number] = [9.9312, 76.2673]
const EVAC_ORIGIN: [number,number] = [9.934, 76.270]
const FLOOD_CENTER: [number,number] = [9.922, 76.268]
const RIVER_LAT = 9.918
const ROUTE_COLORS = ['#2563eb','#0891b2','#7c3aed','#059669','#ca8a04','#dc2626','#b45309','#0e7490',
  '#6d28d9','#0284c7','#15803d','#b91c1c','#9333ea','#0369a1','#166534','#92400e',
  '#4f46e5','#0891b2','#065f46','#7f1d1d','#1e40af','#4338ca']

// ─── Types ────────────────────────────────────────────────────────────────────
type AppView = 'landing'|'public'|'admin'|'earthquake'
type MapMode = 'normal'|'seismic'|'hydro'
interface Place { id:string; name:string; lat:number; lng:number; type:'hospital'|'school' }
interface RouteData { coords:[number,number][]; duration:number; distance:number }
interface EvacRoute { id:string; dest:{name:string;lat:number;lng:number}; data:RouteData|null; color:string; blocked:boolean; type:'evac'|'ambulance' }
interface Obstacle { id:string; lat:number; lng:number; desc:string; affectedIds:string[] }
interface AmbulanceRoute { id:string; from:{name:string;lat:number;lng:number}; to:{name:string;lat:number;lng:number}; data:RouteData|null }
type CardStatus = 'pending'|'approved'|'rejected'|'reviewing'
interface SoilPoint { lat:number; lng:number; value:number }
interface QuakePoint { lat:number; lng:number; mag:number; depth:number; place:string }
interface Dam { id:string; name:string; lat:number; lng:number; fillPct:number; capacity:number; alert:boolean }

// ─── Kerala dams ──────────────────────────────────────────────────────────────
const KERALA_DAMS: Dam[] = [
  {id:'d01',name:'Idukki Dam',lat:9.849,lng:76.974,fillPct:78,capacity:1996,alert:false},
  {id:'d02',name:'Mullaperiyar',lat:9.518,lng:77.148,fillPct:88,capacity:443,alert:true},
  {id:'d03',name:'Kakki Reservoir',lat:9.393,lng:77.160,fillPct:71,capacity:463,alert:false},
  {id:'d04',name:'Banasura Sagar',lat:11.647,lng:76.039,fillPct:65,capacity:209,alert:false},
  {id:'d05',name:'Malampuzha',lat:10.874,lng:76.737,fillPct:52,capacity:152,alert:false},
  {id:'d06',name:'Pamba Dam',lat:9.346,lng:77.010,fillPct:44,capacity:65,alert:false},
  {id:'d07',name:'Parambikulam',lat:10.363,lng:76.778,fillPct:67,capacity:328,alert:false},
  {id:'d08',name:'Sholayar',lat:10.379,lng:76.779,fillPct:58,capacity:152,alert:false},
  {id:'d09',name:'Mattupetty',lat:10.083,lng:77.086,fillPct:72,capacity:56,alert:false},
  {id:'d10',name:'Kundala',lat:10.092,lng:77.054,fillPct:68,capacity:16,alert:false},
  {id:'d11',name:'Meenkara',lat:10.852,lng:76.756,fillPct:49,capacity:21,alert:false},
  {id:'d12',name:'Siruvani',lat:10.956,lng:76.635,fillPct:84,capacity:71,alert:true},
  {id:'d13',name:'Maniyar',lat:9.565,lng:77.101,fillPct:61,capacity:152,alert:false},
  {id:'d14',name:'Kallarkutty',lat:9.972,lng:76.907,fillPct:55,capacity:50,alert:false},
  {id:'d15',name:'Walayar',lat:10.857,lng:76.865,fillPct:38,capacity:7,alert:false},
]

// ─── Admin evac exits — 22 major routes out of Ernakulam ─────────────────────
const EVAC_EXITS = [
  // NH 66 North
  {id:'ex01',name:'NH66 Aluva North',lat:10.108,lng:76.358,dir:'N'},
  {id:'ex02',name:'Angamaly Junction',lat:10.197,lng:76.384,dir:'N'},
  {id:'ex03',name:'Chalakudy North',lat:10.302,lng:76.333,dir:'N'},
  {id:'ex04',name:'Thrissur City Exit',lat:10.522,lng:76.214,dir:'N'},
  {id:'ex05',name:'Shoranur NH66',lat:10.769,lng:76.281,dir:'N'},
  // NH 66 South
  {id:'ex06',name:'Aroor Bridge South',lat:9.872,lng:76.348,dir:'S'},
  {id:'ex07',name:'Cherthala Exit',lat:9.683,lng:76.337,dir:'S'},
  {id:'ex08',name:'Haripad South',lat:9.235,lng:76.476,dir:'S'},
  {id:'ex09',name:'Kayamkulam Exit',lat:9.173,lng:76.502,dir:'S'},
  {id:'ex10',name:'Kollam Bypass',lat:8.893,lng:76.610,dir:'S'},
  // NH 544 East (Kochi–Coimbatore)
  {id:'ex11',name:'Edappally East',lat:10.025,lng:76.329,dir:'E'},
  {id:'ex12',name:'Perumbavoor NH544',lat:10.116,lng:76.479,dir:'E'},
  {id:'ex13',name:'Kothamangalam Exit',lat:10.056,lng:76.623,dir:'E'},
  // Kottayam/South-East
  {id:'ex14',name:'Muvattupuzha SE',lat:9.983,lng:76.578,dir:'SE'},
  {id:'ex15',name:'Kottayam City',lat:9.591,lng:76.523,dir:'SE'},
  {id:'ex16',name:'Changanacherry',lat:9.444,lng:76.543,dir:'S'},
  {id:'ex17',name:'Thiruvalla Exit',lat:9.381,lng:76.574,dir:'S'},
  // Inland
  {id:'ex18',name:'Kalamassery Bypass',lat:10.035,lng:76.314,dir:'NE'},
  {id:'ex19',name:'Kakkanad Tech Park',lat:10.012,lng:76.346,dir:'NE'},
  {id:'ex20',name:'Mulanthuruthy Rd',lat:9.855,lng:76.378,dir:'SE'},
  {id:'ex21',name:'Irinjalakuda North',lat:10.341,lng:76.214,dir:'N'},
  {id:'ex22',name:'Palakkad Highway',lat:10.770,lng:76.650,dir:'NE'},
]

// ─── Pre-built incident cards ─────────────────────────────────────────────────
interface IncidentCard {
  id:string; icon:string; title:string; tag:string; tagColor:string
  body:string; type:'block'|'ambulance'|'transfer'
  blockCoord?:[number,number]; blockDesc?:string
  incidentCoord?:[number,number]; hospitalId?:string
  fromHospitalId?:string; toHospitalId?:string
}
const INCIDENT_CARDS: IncidentCard[] = [
  {
    id:'inc01', icon:'🌲', title:'ROAD OBSTRUCTION REPORTED', tag:'NH 66', tagColor:'#f97316',
    body:'Fallen tree blocking NH 66 near Kalamassery Junction. All northbound lanes obstructed. Reported by traffic police at 14:32 IST.',
    type:'block', blockCoord:[10.035,76.314], blockDesc:'Fallen tree — NH 66 Kalamassery',
  },
  {
    id:'inc02', icon:'🚑', title:'MEDICAL EMERGENCY', tag:'AMBULANCE', tagColor:'#ef4444',
    body:'Flood victim with head injury at Marine Drive waterfront, Ernakulam (9.9648, 76.2780). Nearest hospital: Medical Trust. Requesting immediate dispatch.',
    type:'ambulance', incidentCoord:[9.9648,76.2780], hospitalId:'fh034',
  },
  {
    id:'inc03', icon:'🚑', title:'MULTIPLE CASUALTIES', tag:'AMBULANCE', tagColor:'#ef4444',
    body:'3 injured persons at Vyttila junction flyover (9.9282, 76.3019) — possible structural failure. Requesting ambulance from Ernakulam General Hospital.',
    type:'ambulance', incidentCoord:[9.9282,76.3019], hospitalId:'fh038',
  },
  {
    id:'inc04', icon:'🌲', title:'BRIDGE APPROACH BLOCKED', tag:'SEAPORT RD', tagColor:'#f97316',
    body:'Debris and waterlogging blocking Seaport-Airport Road near Thrikkakara. Evacuation routes ex18, ex19 impacted. Road closed since 16:05 IST.',
    type:'block', blockCoord:[10.012,76.339], blockDesc:'Waterlogging — Seaport-Airport Rd',
  },
  {
    id:'inc05', icon:'🏥', title:'PATIENT EVACUATION ALERT', tag:'PRE-FLOOD', tagColor:'#a78bfa',
    body:'PVS Memorial Hospital is within the projected flood inundation zone. 31 critical patients require transfer to Aster Medcity, Cheranalloor (outside the danger perimeter). Authorize patient convoy before flood arrival.',
    type:'transfer', fromHospitalId:'fh041', toHospitalId:'fh039',
  },
]

// ─── Fallback hospitals (94 across all Kerala districts) ─────────────────────
const FALLBACK_HOSPITALS: Place[] = [
  {id:'fh001',name:'SCTIMST Thiruvananthapuram',lat:8.531,lng:76.901,type:'hospital'},
  {id:'fh002',name:'SAT Govt Hospital TVM',lat:8.504,lng:76.946,type:'hospital'},
  {id:'fh003',name:'Govt Medical College TVM',lat:8.523,lng:76.915,type:'hospital'},
  {id:'fh004',name:'KIMS Hospital TVM',lat:8.515,lng:76.940,type:'hospital'},
  {id:'fh005',name:'Ananthapuri Hospital TVM',lat:8.543,lng:76.908,type:'hospital'},
  {id:'fh006',name:'AIMS Neyyatinkara',lat:8.400,lng:77.087,type:'hospital'},
  {id:'fh007',name:'Travancore Medical Attingal',lat:8.480,lng:76.960,type:'hospital'},
  {id:'fh008',name:'Govt Hospital Varkala',lat:8.734,lng:76.716,type:'hospital'},
  {id:'fh009',name:'Govt District Hospital Kollam',lat:8.893,lng:76.610,type:'hospital'},
  {id:'fh010',name:'ESIC Hospital Kollam',lat:8.880,lng:76.596,type:'hospital'},
  {id:'fh011',name:'Travancore Medical College',lat:8.855,lng:76.585,type:'hospital'},
  {id:'fh012',name:'Baby Memorial Hospital Kollam',lat:8.900,lng:76.618,type:'hospital'},
  {id:'fh013',name:'Upasana Hospital Kollam',lat:8.871,lng:76.601,type:'hospital'},
  {id:'fh014',name:'Pushpagiri Medical Thiruvalla',lat:9.381,lng:76.574,type:'hospital'},
  {id:'fh015',name:'Dist Hospital Pathanamthitta',lat:9.265,lng:76.788,type:'hospital'},
  {id:'fh016',name:'St Johns Medical Pathanamthitta',lat:9.271,lng:76.795,type:'hospital'},
  {id:'fh017',name:'Believers Church Medical',lat:9.350,lng:76.620,type:'hospital'},
  {id:'fh018',name:'Govt Medical College Alappuzha',lat:9.491,lng:76.342,type:'hospital'},
  {id:'fh019',name:'CARE Hospital Alappuzha',lat:9.504,lng:76.351,type:'hospital'},
  {id:'fh020',name:'Dist Hospital Chengannur',lat:9.318,lng:76.615,type:'hospital'},
  {id:'fh021',name:'Taluk Hospital Mavelikkara',lat:9.264,lng:76.554,type:'hospital'},
  {id:'fh022',name:'Kayamkulam Dist Hospital',lat:9.173,lng:76.502,type:'hospital'},
  {id:'fh023',name:'St Josephs Hospital Alappuzha',lat:9.495,lng:76.345,type:'hospital'},
  {id:'fh024',name:'Kottayam Govt Medical College',lat:9.555,lng:76.521,type:'hospital'},
  {id:'fh025',name:'Caritas Hospital Kottayam',lat:9.584,lng:76.528,type:'hospital'},
  {id:'fh026',name:'Bethania Hospital Kottayam',lat:9.591,lng:76.516,type:'hospital'},
  {id:'fh027',name:'St Thomas Hospital Kottayam',lat:9.640,lng:76.559,type:'hospital'},
  {id:'fh028',name:'Taluk Hospital Changanacherry',lat:9.444,lng:76.543,type:'hospital'},
  {id:'fh029',name:'Dist Hospital Thodupuzha',lat:9.898,lng:76.717,type:'hospital'},
  {id:'fh030',name:'Taluk Hospital Adimali',lat:10.007,lng:76.982,type:'hospital'},
  {id:'fh031',name:'Dist Hospital Kattappana',lat:9.745,lng:77.115,type:'hospital'},
  {id:'fh032',name:'Primary HC Munnar',lat:10.089,lng:77.060,type:'hospital'},
  {id:'fh033',name:'Medical Trust Hospital',lat:9.980,lng:76.295,type:'hospital'},
  {id:'fh034',name:'Medical Trust Ernakulam',lat:9.980,lng:76.295,type:'hospital'},
  {id:'fh035',name:'Lakeshore Hospital Kochi',lat:9.989,lng:76.310,type:'hospital'},
  {id:'fh036',name:'Amrita Institute of Medical Sciences',lat:9.940,lng:76.307,type:'hospital'},
  {id:'fh037',name:'Rajagiri Hospital Aluva',lat:10.068,lng:76.355,type:'hospital'},
  {id:'fh038',name:'Ernakulam Govt General Hospital',lat:9.966,lng:76.294,type:'hospital'},
  {id:'fh039',name:'Aster Medcity Cheranalloor',lat:9.995,lng:76.337,type:'hospital'},
  {id:'fh040',name:'Sunrise Hospital Kakkanad',lat:10.017,lng:76.340,type:'hospital'},
  {id:'fh041',name:'PVS Memorial Hospital',lat:9.960,lng:76.277,type:'hospital'},
  {id:'fh042',name:'VPS Lakeshore Kochi',lat:9.971,lng:76.301,type:'hospital'},
  {id:'fh043',name:'Renai Medicity Palarivattom',lat:9.990,lng:76.300,type:'hospital'},
  {id:'fh044',name:'ESIC Hospital Elamakkara',lat:10.004,lng:76.302,type:'hospital'},
  {id:'fh045',name:'Dist Hospital Muvattupuzha',lat:9.983,lng:76.578,type:'hospital'},
  {id:'fh046',name:'Taluk Hospital Perumbavoor',lat:10.116,lng:76.479,type:'hospital'},
  {id:'fh047',name:'Govt Hospital North Paravur',lat:10.146,lng:76.223,type:'hospital'},
  {id:'fh048',name:'Govt Hospital Vypeen',lat:10.054,lng:76.195,type:'hospital'},
  {id:'fh049',name:'Little Flower Hospital Angamaly',lat:10.197,lng:76.384,type:'hospital'},
  {id:'fh050',name:'Thrissur Govt Medical College',lat:10.531,lng:76.218,type:'hospital'},
  {id:'fh051',name:'Jubilee Mission Hospital',lat:10.519,lng:76.207,type:'hospital'},
  {id:'fh052',name:'Amala Institute Thrissur',lat:10.535,lng:76.202,type:'hospital'},
  {id:'fh053',name:'Holy Family Hospital Thrissur',lat:10.543,lng:76.213,type:'hospital'},
  {id:'fh054',name:'Dist Hospital Irinjalakuda',lat:10.341,lng:76.214,type:'hospital'},
  {id:'fh055',name:'Taluk Hospital Chalakudy',lat:10.302,lng:76.333,type:'hospital'},
  {id:'fh056',name:'Govt Hospital Guruvayur',lat:10.595,lng:76.043,type:'hospital'},
  {id:'fh057',name:'Govt Hospital Kodungallur',lat:10.231,lng:76.205,type:'hospital'},
  {id:'fh058',name:'Dist Hospital Palakkad',lat:10.774,lng:76.650,type:'hospital'},
  {id:'fh059',name:'ESIC Hospital Palakkad',lat:10.783,lng:76.657,type:'hospital'},
  {id:'fh060',name:'Govt Medical College Palakkad',lat:10.770,lng:76.644,type:'hospital'},
  {id:'fh061',name:'Taluk Hospital Ottapalam',lat:10.772,lng:76.378,type:'hospital'},
  {id:'fh062',name:'Govt Hospital Mannarkkad',lat:10.990,lng:76.461,type:'hospital'},
  {id:'fh063',name:'Govt Hospital Shoranur',lat:10.769,lng:76.281,type:'hospital'},
  {id:'fh064',name:'Manjeri Medical College',lat:11.120,lng:76.120,type:'hospital'},
  {id:'fh065',name:'Govt Medical College Malappuram',lat:11.040,lng:76.078,type:'hospital'},
  {id:'fh066',name:'Dist Hospital Malappuram',lat:11.041,lng:76.074,type:'hospital'},
  {id:'fh067',name:'Taluk Hospital Tirur',lat:10.912,lng:75.922,type:'hospital'},
  {id:'fh068',name:'Govt Hospital Ponnani',lat:10.773,lng:75.920,type:'hospital'},
  {id:'fh069',name:'MIMS Hospital Malappuram',lat:11.037,lng:76.070,type:'hospital'},
  {id:'fh070',name:'Kozhikode Govt Medical College',lat:11.256,lng:75.791,type:'hospital'},
  {id:'fh071',name:'Baby Memorial Hospital Calicut',lat:11.245,lng:75.783,type:'hospital'},
  {id:'fh072',name:'Aster MIMS Kozhikode',lat:11.258,lng:75.795,type:'hospital'},
  {id:'fh073',name:'Taluk Hospital Vadakara',lat:11.603,lng:75.591,type:'hospital'},
  {id:'fh074',name:'Govt Hospital Koyilandy',lat:11.440,lng:75.706,type:'hospital'},
  {id:'fh075',name:'Dist Hospital Kalpetta',lat:11.607,lng:76.085,type:'hospital'},
  {id:'fh076',name:'DM WIMS Medical Meppadi',lat:11.468,lng:76.164,type:'hospital'},
  {id:'fh077',name:'Govt Hospital Mananthavady',lat:11.803,lng:76.001,type:'hospital'},
  {id:'fh078',name:'Govt Hospital Sulthan Bathery',lat:11.648,lng:76.258,type:'hospital'},
  {id:'fh079',name:'Pariyaram Medical College',lat:11.928,lng:75.497,type:'hospital'},
  {id:'fh080',name:'Govt Dist Hospital Kannur',lat:11.868,lng:75.371,type:'hospital'},
  {id:'fh081',name:'Taluk Hospital Thalassery',lat:11.752,lng:75.490,type:'hospital'},
  {id:'fh082',name:'Govt Hospital Iritty',lat:12.152,lng:75.524,type:'hospital'},
  {id:'fh083',name:'Govt Hospital Payyanur',lat:12.099,lng:75.207,type:'hospital'},
  {id:'fh084',name:'Dist Hospital Kasaragod',lat:12.496,lng:74.984,type:'hospital'},
  {id:'fh085',name:'Govt Medical College Kasaragod',lat:12.490,lng:74.990,type:'hospital'},
  {id:'fh086',name:'Taluk Hospital Kanhangad',lat:12.328,lng:75.104,type:'hospital'},
  {id:'fh087',name:'Govt Hospital Hosdurg',lat:12.361,lng:75.033,type:'hospital'},
  {id:'fh088',name:'General Hospital Manjeshwar',lat:12.715,lng:74.892,type:'hospital'},
]

// ─── Fallback schools (92 across all Kerala districts) ───────────────────────
const FALLBACK_SCHOOLS: Place[] = [
  {id:'fs001',name:'Govt Model Boys HSS Trivandrum',lat:8.524,lng:76.936,type:'school'},
  {id:'fs002',name:'Govt Girls HSS Trivandrum',lat:8.509,lng:76.944,type:'school'},
  {id:'fs003',name:'Kendriya Vidyalaya Pattom',lat:8.538,lng:76.904,type:'school'},
  {id:'fs004',name:'Mar Ivanios HSS TVM',lat:8.530,lng:76.918,type:'school'},
  {id:'fs005',name:'St Josephs HSS TVM',lat:8.518,lng:76.951,type:'school'},
  {id:'fs006',name:'GHSS Neyyatinkara',lat:8.399,lng:77.089,type:'school'},
  {id:'fs007',name:'GHSS Attingal',lat:8.686,lng:76.813,type:'school'},
  {id:'fs008',name:'GHSS Varkala',lat:8.734,lng:76.716,type:'school'},
  {id:'fs009',name:'Sree Narayana HSS Kollam',lat:8.893,lng:76.608,type:'school'},
  {id:'fs010',name:'Govt Boys HSS Kollam',lat:8.882,lng:76.597,type:'school'},
  {id:'fs011',name:'St Aloysius HSS Kollam',lat:8.878,lng:76.602,type:'school'},
  {id:'fs012',name:'GHSS Karunagappally',lat:9.050,lng:76.537,type:'school'},
  {id:'fs013',name:'GHSS Chavara',lat:8.959,lng:76.553,type:'school'},
  {id:'fs014',name:'Govt Boys HSS Pathanamthitta',lat:9.264,lng:76.789,type:'school'},
  {id:'fs015',name:'CMS HSS Thiruvalla',lat:9.382,lng:76.572,type:'school'},
  {id:'fs016',name:'GHSS Adoor',lat:9.156,lng:76.739,type:'school'},
  {id:'fs017',name:'NSS HSS Pandalam',lat:9.209,lng:76.671,type:'school'},
  {id:'fs018',name:'SNVHSS Alappuzha',lat:9.497,lng:76.339,type:'school'},
  {id:'fs019',name:'St Josephs Girls HSS Alleppey',lat:9.485,lng:76.355,type:'school'},
  {id:'fs020',name:'GHSS Chengannur',lat:9.318,lng:76.617,type:'school'},
  {id:'fs021',name:'GHSS Mavelikkara',lat:9.265,lng:76.553,type:'school'},
  {id:'fs022',name:'GHSS Haripad',lat:9.235,lng:76.476,type:'school'},
  {id:'fs023',name:'GHSS Kayamkulam',lat:9.171,lng:76.504,type:'school'},
  {id:'fs024',name:'CMS Higher Secondary Kottayam',lat:9.591,lng:76.523,type:'school'},
  {id:'fs025',name:'Baselios Vidyapeedom',lat:9.575,lng:76.514,type:'school'},
  {id:'fs026',name:'Govt Boys HSS Kottayam',lat:9.588,lng:76.520,type:'school'},
  {id:'fs027',name:'GHSS Changanacherry',lat:9.442,lng:76.541,type:'school'},
  {id:'fs028',name:'GHSS Pala',lat:9.707,lng:76.681,type:'school'},
  {id:'fs029',name:'GHSS Vaikom',lat:9.752,lng:76.399,type:'school'},
  {id:'fs030',name:'GHSS Munnar',lat:10.089,lng:77.060,type:'school'},
  {id:'fs031',name:'GHSS Thodupuzha',lat:9.898,lng:76.715,type:'school'},
  {id:'fs032',name:'GHSS Adimali',lat:10.007,lng:76.980,type:'school'},
  {id:'fs033',name:'GHSS Kattappana',lat:9.745,lng:77.117,type:'school'},
  {id:'fs034',name:'Maharajas College HSS',lat:9.983,lng:76.290,type:'school'},
  {id:'fs035',name:'St Alberts HSS Ernakulam',lat:9.998,lng:76.298,type:'school'},
  {id:'fs036',name:'Kendriya Vidyalaya Ernakulam',lat:9.967,lng:76.310,type:'school'},
  {id:'fs037',name:'Sacred Heart Girls HSS',lat:9.951,lng:76.281,type:'school'},
  {id:'fs038',name:'Kendriya Vidyalaya Kakkanad',lat:10.012,lng:76.346,type:'school'},
  {id:'fs039',name:'GHSS Aluva',lat:10.099,lng:76.356,type:'school'},
  {id:'fs040',name:'SNHSS Angamaly',lat:10.197,lng:76.384,type:'school'},
  {id:'fs041',name:'Good Shepherd HSS Perumbavoor',lat:10.116,lng:76.479,type:'school'},
  {id:'fs042',name:'GHSS Muvattupuzha',lat:9.983,lng:76.580,type:'school'},
  {id:'fs043',name:'GHSS Kothamangalam',lat:10.056,lng:76.623,type:'school'},
  {id:'fs044',name:'GHSS Paravur',lat:10.149,lng:76.223,type:'school'},
  {id:'fs045',name:'Govt Boys HSS Mattanchery',lat:9.953,lng:76.256,type:'school'},
  {id:'fs046',name:'St Teresas Girls HSS',lat:9.979,lng:76.283,type:'school'},
  {id:'fs047',name:'GHSS Piravom',lat:9.869,lng:76.505,type:'school'},
  {id:'fs048',name:'GHSS Vypeen',lat:10.055,lng:76.197,type:'school'},
  {id:'fs049',name:'St Thomas HSS Thrissur',lat:10.522,lng:76.214,type:'school'},
  {id:'fs050',name:'Govt Boys HSS Thrissur',lat:10.530,lng:76.221,type:'school'},
  {id:'fs051',name:'Sacred Heart Girls HSS Thrissur',lat:10.516,lng:76.210,type:'school'},
  {id:'fs052',name:'GHSS Irinjalakuda',lat:10.341,lng:76.212,type:'school'},
  {id:'fs053',name:'GHSS Chalakudy',lat:10.300,lng:76.335,type:'school'},
  {id:'fs054',name:'GHSS Guruvayur',lat:10.594,lng:76.042,type:'school'},
  {id:'fs055',name:'GHSS Kodungallur',lat:10.229,lng:76.207,type:'school'},
  {id:'fs056',name:'GHSS Kunnamkulam',lat:10.656,lng:76.071,type:'school'},
  {id:'fs057',name:'Victoria College HSS Palakkad',lat:10.776,lng:76.654,type:'school'},
  {id:'fs058',name:'Govt Boys HSS Palakkad',lat:10.774,lng:76.648,type:'school'},
  {id:'fs059',name:'GHSS Ottapalam',lat:10.771,lng:76.379,type:'school'},
  {id:'fs060',name:'GHSS Shoranur',lat:10.767,lng:76.280,type:'school'},
  {id:'fs061',name:'GHSS Mannarkkad',lat:10.991,lng:76.463,type:'school'},
  {id:'fs062',name:'GHSS Chittur',lat:10.698,lng:76.741,type:'school'},
  {id:'fs063',name:'MES Mampad HSS',lat:11.050,lng:76.073,type:'school'},
  {id:'fs064',name:'Govt Boys HSS Malappuram',lat:11.041,lng:76.076,type:'school'},
  {id:'fs065',name:'GHSS Tirur',lat:10.912,lng:75.924,type:'school'},
  {id:'fs066',name:'GHSS Ponnani',lat:10.774,lng:75.921,type:'school'},
  {id:'fs067',name:'GHSS Perinthalmanna',lat:10.975,lng:76.226,type:'school'},
  {id:'fs068',name:'GHSS Nilambur',lat:11.281,lng:76.228,type:'school'},
  {id:'fs069',name:'GHSS Kondotty',lat:11.073,lng:75.978,type:'school'},
  {id:'fs070',name:'Govt Brennen HSS Kozhikode',lat:11.249,lng:75.775,type:'school'},
  {id:'fs071',name:'Malabar Christian HSS',lat:11.258,lng:75.788,type:'school'},
  {id:'fs072',name:'Govt Girls HSS Kozhikode',lat:11.243,lng:75.779,type:'school'},
  {id:'fs073',name:'GHSS Vadakara',lat:11.601,lng:75.593,type:'school'},
  {id:'fs074',name:'GHSS Koyilandy',lat:11.440,lng:75.706,type:'school'},
  {id:'fs075',name:'GHSS Ramanattukara',lat:11.198,lng:75.826,type:'school'},
  {id:'fs076',name:'GHSS Feroke',lat:11.195,lng:75.820,type:'school'},
  {id:'fs077',name:'GHSS Kalpetta',lat:11.609,lng:76.082,type:'school'},
  {id:'fs078',name:'GHSS Mananthavady',lat:11.801,lng:76.003,type:'school'},
  {id:'fs079',name:'GHSS Sulthan Bathery',lat:11.648,lng:76.259,type:'school'},
  {id:'fs080',name:'GHSS Vythiri',lat:11.555,lng:76.122,type:'school'},
  {id:'fs081',name:'GHSS Ambalavayal',lat:11.737,lng:76.148,type:'school'},
  {id:'fs082',name:'Brennen HSS Kannur',lat:11.868,lng:75.371,type:'school'},
  {id:'fs083',name:'GHSS Thalassery',lat:11.751,lng:75.492,type:'school'},
  {id:'fs084',name:'GHSS Iritty',lat:12.150,lng:75.526,type:'school'},
  {id:'fs085',name:'GHSS Payyanur',lat:12.098,lng:75.208,type:'school'},
  {id:'fs086',name:'St Josephs HSS Kannur',lat:11.872,lng:75.375,type:'school'},
  {id:'fs087',name:'Govt HSS Kasaragod',lat:12.499,lng:74.987,type:'school'},
  {id:'fs088',name:'Govt Boys HSS Kanhangad',lat:12.327,lng:75.107,type:'school'},
  {id:'fs089',name:'GHSS Hosdurg',lat:12.361,lng:75.034,type:'school'},
  {id:'fs090',name:'GHSS Manjeshwar',lat:12.715,lng:74.893,type:'school'},
  {id:'fs091',name:'Kendriya Vidyalaya Kasaragod',lat:12.493,lng:74.982,type:'school'},
  {id:'fs092',name:'GHSS Nileshwar',lat:12.250,lng:75.133,type:'school'},
]

// ─── Flood simulation ─────────────────────────────────────────────────────────
function floodProgress(t:number):number {
  if (t < 0.15) return 0
  return Math.min(1,(t-0.15)/0.7)
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function haversineM(lat1:number,lng1:number,lat2:number,lng2:number):number {
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}
function routeNear(route:RouteData,lat:number,lng:number,thM=350):boolean {
  return route.coords.some(([rlat,rlng])=>haversineM(rlat,rlng,lat,lng)<thM)
}

// ─── Data fetching ─────────────────────────────────────────────────────────────
async function overpassQuery(q:string,timeoutMs=28000):Promise<Place[]> {
  try {
    const ctrl=new AbortController()
    const t=setTimeout(()=>ctrl.abort(),timeoutMs)
    const res=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(q),{signal:ctrl.signal})
    clearTimeout(t)
    const json=await res.json()
    const out:Place[]=[]
    for (const el of (json.elements||[])) {
      const lat=el.lat??el.center?.lat, lng=el.lon??el.center?.lon
      if (!lat||!lng) continue
      const name=el.tags?.name||el.tags?.['name:en']||el.tags?.['name:ml']||''
      const amenity=el.tags?.amenity
      out.push({id:`osm_${el.id}`,name:name||`${amenity} (${lat.toFixed(3)},${lng.toFixed(3)})`,lat,lng,type:amenity==='school'?'school':'hospital'})
    }
    return out
  } catch { return [] }
}
function mergeUnique(live:Place[],fallback:Place[]):Place[] {
  const all=[...live]
  for (const fb of fallback) {
    if (!all.some(p=>haversineM(p.lat,p.lng,fb.lat,fb.lng)<50)) all.push(fb)
  }
  return all
}
async function fetchPlaces():Promise<{schools:Place[];hospitals:Place[]}> {
  const r=150000
  const [lH,lS]=await Promise.all([
    overpassQuery(`[out:json][timeout:28];(node[amenity=hospital](around:${r},${CENTER[0]},${CENTER[1]});node[amenity=clinic](around:${r},${CENTER[0]},${CENTER[1]});way[amenity=hospital](around:${r},${CENTER[0]},${CENTER[1]}););out center;`),
    overpassQuery(`[out:json][timeout:28];(node[amenity=school](around:${r},${CENTER[0]},${CENTER[1]});way[amenity=school](around:${r},${CENTER[0]},${CENTER[1]}););out center;`),
  ])
  return { hospitals:mergeUnique(lH,FALLBACK_HOSPITALS), schools:mergeUnique(lS,FALLBACK_SCHOOLS) }
}

async function fetchRoute(from:[number,number],to:[number,number]):Promise<RouteData|null> {
  try {
    const ctrl=new AbortController()
    setTimeout(()=>ctrl.abort(),10000)
    const res=await fetch(`https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`,{signal:ctrl.signal})
    const d=await res.json()
    if (d.code==='Ok'&&d.routes?.[0]) {
      const r=d.routes[0]
      return {coords:(r.geometry.coordinates as [number,number][]).map(([lng,lat])=>[lat,lng] as [number,number]),duration:Math.ceil(r.duration/60),distance:parseFloat((r.distance/1000).toFixed(1))}
    }
  } catch {}
  const dx=(to[0]-from[0])*111,dy=(to[1]-from[1])*98,d=Math.sqrt(dx*dx+dy*dy)
  return {coords:[from,to],duration:Math.ceil(d*3),distance:parseFloat(d.toFixed(1))}
}

// 25-point 5×5 grid spanning all of Kerala
// ─── Kerala district boundaries ──────────────────────────────────────────────
interface DistrictBoundary { name:string; coords:[number,number][] }

function stitchWays(ways:[number,number][][]):[number,number][] {
  if (!ways.length) return []
  const result=[...ways[0]]
  const remaining=[...ways.slice(1)]
  while (remaining.length>0) {
    const last=result[result.length-1]
    let found=false
    for (let i=0;i<remaining.length;i++) {
      const w=remaining[i]
      if (!w.length) { remaining.splice(i,1); found=true; break }
      const near=(a:[number,number],b:[number,number])=>Math.abs(a[0]-b[0])<0.002&&Math.abs(a[1]-b[1])<0.002
      if (near(w[0],last)) { result.push(...w.slice(1)); remaining.splice(i,1); found=true; break }
      if (near(w[w.length-1],last)) { result.push(...[...w].reverse().slice(1)); remaining.splice(i,1); found=true; break }
    }
    if (!found) break
  }
  return result
}

async function fetchKeralaDistrictBoundaries():Promise<DistrictBoundary[]> {
  try {
    const q=`[out:json][timeout:35];area["ISO3166-2"="IN-KL"]["admin_level"="4"]->.k;relation["admin_level"="6"]["boundary"="administrative"](area.k);out geom;`
    const ctrl=new AbortController(); setTimeout(()=>ctrl.abort(),35000)
    const res=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:`data=${encodeURIComponent(q)}`,signal:ctrl.signal})
    const d=await res.json()
    return ((d.elements||[]) as Record<string,unknown>[]).map(rel=>{
      const tags=rel.tags as Record<string,string>
      const name=tags?.['name:en']||tags?.name||'Unknown'
      type Member={type:string;role:string;geometry:{lat:number;lon:number}[]}
      const members=rel.members as Member[]
      const outers=members.filter(m=>m.type==='way'&&m.role==='outer'&&m.geometry?.length)
      const coords=stitchWays(outers.map(w=>w.geometry.map(g=>[g.lat,g.lon] as [number,number])))
      return {name,coords}
    }).filter((d:DistrictBoundary)=>d.coords.length>3)
  } catch { return [] }
}

const KERALA_GRID_PTS:[number,number][]=[
  [8.3,76.6],[8.3,76.9],[8.3,77.2],[8.3,77.5],[8.3,77.8],
  [9.0,76.0],[9.0,76.4],[9.0,76.8],[9.0,77.2],[9.0,77.6],
  [9.9,75.9],[9.9,76.3],[9.9,76.7],[9.9,77.1],[9.9,77.5],
  [10.8,75.9],[10.8,76.2],[10.8,76.6],[10.8,77.0],[10.8,77.4],
  [11.7,75.5],[11.7,75.8],[11.7,76.2],[11.7,76.6],[11.7,77.0],
]
async function fetchSoilGrid():Promise<SoilPoint[]> {
  const fallback=KERALA_GRID_PTS.map(([lat,lng],i)=>({lat,lng,value:0.28+((i*7)%23)*0.015}))
  try {
    const lats=KERALA_GRID_PTS.map(p=>p[0]).join(',')
    const lngs=KERALA_GRID_PTS.map(p=>p[1]).join(',')
    const ctrl=new AbortController(); setTimeout(()=>ctrl.abort(),14000)
    const res=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=soil_moisture_0_to_1cm&timezone=Asia%2FKolkata&forecast_days=1`,{signal:ctrl.signal})
    const data=await res.json()
    const arr:Record<string,unknown>[]=Array.isArray(data)?data:[data]
    return arr.map((d,i)=>{
      const cur=d.current as Record<string,unknown>|undefined
      const val=(cur?.soil_moisture_0_to_1cm as number|undefined)??fallback[i].value
      return {lat:KERALA_GRID_PTS[i][0],lng:KERALA_GRID_PTS[i][1],value:val}
    })
  } catch { return fallback }
}

interface WeatherPoint { lat:number; lng:number; precip:number; cloud:number; temp:number }
async function fetchWeatherGrid():Promise<WeatherPoint[]> {
  const fallback=KERALA_GRID_PTS.map(([lat,lng],i)=>({lat,lng,precip:(i*11)%100/10,cloud:30+((i*13)%60),temp:27+((i*3)%8)}))
  try {
    const lats=KERALA_GRID_PTS.map(p=>p[0]).join(',')
    const lngs=KERALA_GRID_PTS.map(p=>p[1]).join(',')
    const ctrl=new AbortController(); setTimeout(()=>ctrl.abort(),14000)
    const res=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=precipitation,cloud_cover,temperature_2m&timezone=Asia%2FKolkata&forecast_days=1`,{signal:ctrl.signal})
    const data=await res.json()
    const arr:Record<string,unknown>[]=Array.isArray(data)?data:[data]
    return arr.map((d,i)=>{
      const cur=d.current as Record<string,unknown>|undefined
      return {
        lat:KERALA_GRID_PTS[i][0],lng:KERALA_GRID_PTS[i][1],
        precip:(cur?.precipitation as number|undefined)??fallback[i].precip,
        cloud:(cur?.cloud_cover as number|undefined)??fallback[i].cloud,
        temp:(cur?.temperature_2m as number|undefined)??fallback[i].temp,
      }
    })
  } catch { return fallback }
}

interface WeatherPaths { radar:string|null; satellite:string|null }
async function fetchRainViewer():Promise<WeatherPaths> {
  try {
    const res=await fetch('https://api.rainviewer.com/public/weather-maps.json',{signal:AbortSignal.timeout(8000)})
    const d=await res.json()
    const past=d.radar?.past
    const sat=d.satellite?.infrared
    return {
      radar: past?.length ? past[past.length-1].path : null,
      satellite: sat?.length ? sat[sat.length-1].path : null,
    }
  } catch {}
  return {radar:null,satellite:null}
}

async function fetchQuakes():Promise<QuakePoint[]> {
  try {
    const ctrl=new AbortController(); setTimeout(()=>ctrl.abort(),10000)
    const res=await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=0.5&latitude=${CENTER[0]}&longitude=${CENTER[1]}&maxradiuskm=500&limit=80&orderby=time`,{signal:ctrl.signal})
    const d=await res.json()
    return (d.features||[]).map((f:Record<string,unknown>)=>{
      const g=f.geometry as {coordinates:[number,number,number]}
      const p=f.properties as {mag:number;depth?:number;place:string}
      return {lat:g.coordinates[1],lng:g.coordinates[0],mag:p.mag||0,depth:g.coordinates[2]||0,place:p.place||''}
    })
  } catch { return [] }
}

function soilColor(v:number):[string,number] {
  const t=Math.min(1,v/0.5)
  if (t<0.25) return ['#fde68a',0.55]
  if (t<0.55) return ['#4ade80',0.55]
  if (t<0.75) return ['#22d3ee',0.60]
  return ['#2563eb',0.65]
}

// ─── Leaflet icons ─────────────────────────────────────────────────────────────
const mkIcon=(html:string,w=36,h=36,ax=18,ay=18)=>L.divIcon({className:'',html,iconSize:[w,h],iconAnchor:[ax,ay]})

const hospitalIcon=mkIcon(`<div style="width:28px;height:28px;background:#1d4ed8;border:2px solid #93c5fd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;color:#fff;box-shadow:0 0 10px rgba(96,165,250,0.5);font-family:sans-serif">H+</div>`)
const schoolIcon=mkIcon(`<div style="width:24px;height:24px;background:rgba(5,150,105,0.88);border:2px solid #34d399;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 7px rgba(52,211,153,0.4)">🏫</div>`)
const obstacleIcon=mkIcon(`<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:20px;filter:drop-shadow(0 0 5px #ef4444)">🚧</div>`,32,32,16,16)
const ambIcon=mkIcon(`<div style="width:30px;height:30px;background:rgba(239,68,68,0.9);border:2px solid #fca5a5;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 10px rgba(239,68,68,0.6)">🚑</div>`)
const userIcon=(label:string)=>mkIcon(`<div style="text-align:center"><div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 5px rgba(59,130,246,0.3);margin:0 auto 2px"/><div style="background:rgba(15,23,42,0.95);color:#93c5fd;font-family:'JetBrains Mono',monospace;font-size:7.5px;padding:2px 5px;border-radius:2px;border:1px solid rgba(96,165,250,0.35);white-space:nowrap;font-weight:600">${label}</div></div>`,100,30,50,7)
const damIcon=(fillPct:number,alert:boolean)=>mkIcon(`<div style="width:32px;height:32px;background:${alert?'rgba(239,68,68,0.85)':'rgba(14,116,144,0.85)'};border:2px solid ${alert?'#fca5a5':'#67e8f9'};border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-family:monospace"><div style="font-size:8px;color:#fff;font-weight:700">${fillPct}%</div><div style="font-size:9px">${alert?'⚠':'💧'}</div></div>`)

// ─── Shared map tooltip CSS ────────────────────────────────────────────────────
const MAP_TOOLTIP_CSS = `
  .snt-popup-light .leaflet-popup-content-wrapper{background:transparent!important;box-shadow:none!important;padding:0!important;}
  .snt-popup-light .leaflet-popup-tip-container{display:none}
  .leaflet-tooltip.snt-tip{background:rgba(255,255,255,0.97)!important;border:1px solid rgba(0,0,0,0.18)!important;color:#1e293b!important;font-family:'JetBrains Mono',monospace!important;font-size:9.5px!important;font-weight:600!important;padding:3px 8px!important;border-radius:3px!important;pointer-events:none!important;white-space:nowrap!important;}
  .leaflet-tooltip.snt-tip-warn{background:rgba(255,247,237,0.97)!important;border:1px solid rgba(249,115,22,0.5)!important;color:#9a3412!important;font-family:'JetBrains Mono',monospace!important;font-size:9px!important;font-weight:700!important;padding:3px 8px!important;border-radius:3px!important;}
  .leaflet-tooltip.snt-tip-route{background:rgba(239,246,255,0.97)!important;border:1px solid rgba(37,99,235,0.4)!important;color:#1e40af!important;font-family:'JetBrains Mono',monospace!important;font-size:8.5px!important;padding:3px 8px!important;border-radius:3px!important;line-height:1.6!important;white-space:nowrap!important;}
  .leaflet-tooltip.snt-tip-route b{color:#0f172a!important;}
  .leaflet-tooltip.snt-tip-dark{background:rgba(15,23,42,0.95)!important;border:1px solid rgba(6,182,212,0.3)!important;color:#e2e8f0!important;font-family:'JetBrains Mono',monospace!important;font-size:9px!important;padding:3px 8px!important;border-radius:3px!important;white-space:nowrap!important;}
  .leaflet-tooltip::before{display:none!important}
  .leaflet-control-zoom a{background:rgba(255,255,255,0.97)!important;color:#1e293b!important;border-color:rgba(0,0,0,0.15)!important;}
  .leaflet-control-scale-line{background:rgba(255,255,255,0.75)!important;color:#1e293b!important;font-size:8px!important;}
  .leaflet-control-attribution{background:rgba(255,255,255,0.6)!important;color:#94a3b8!important;font-size:7px!important;}
  .marker-cluster-small div,.marker-cluster-medium div,.marker-cluster-large div{background:transparent!important;}
  .snt-pick-cursor{cursor:crosshair!important;}
`

// ─── Soil canvas overlay ──────────────────────────────────────────────────────
function buildSoilCanvas(grid:SoilPoint[]):string {
  const W=600,H=900
  const canvas=document.createElement('canvas')
  canvas.width=W; canvas.height=H
  const ctx=canvas.getContext('2d')!
  ctx.clearRect(0,0,W,H)
  // Kerala bounding box
  const N=13.0,S=8.0,WEST=74.5,EAST=77.6
  const toX=(lng:number)=>((lng-WEST)/(EAST-WEST))*W
  const toY=(lat:number)=>((N-lat)/(N-S))*H
  // Draw large blended radial gradients per grid point
  grid.forEach(({lat,lng,value})=>{
    const x=toX(lng),y=toY(lat),r=Math.max(W,H)*0.52
    const t=Math.min(1,value/0.5)
    let rc=253,gc=230,bc=138  // yellow (dry)
    if (t>0.75){ rc=37;gc=99;bc=235 }       // blue (saturated)
    else if (t>0.5){ rc=34;gc=211;bc=238 }  // cyan (moist)
    else if (t>0.25){ rc=74;gc=222;bc=128 } // green (moderate)
    const g=ctx.createRadialGradient(x,y,0,x,y,r)
    g.addColorStop(0,`rgba(${rc},${gc},${bc},0.55)`)
    g.addColorStop(0.5,`rgba(${rc},${gc},${bc},0.22)`)
    g.addColorStop(1,`rgba(${rc},${gc},${bc},0)`)
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill()
  })
  return canvas.toDataURL()
}

// ─── Flood pulse animation (circles) ─────────────────────────────────────────
// Renders outside React, driven by a setInterval that reads timelineRef
function useFloodCircles(mapRef:React.MutableRefObject<L.Map|null>, floodActive:boolean, timelineRef:React.MutableRefObject<number>) {
  useEffect(()=>{
    if (!mapRef.current||!floodActive) return
    const m=mapRef.current
    const rings=[
      {mult:0.8,fill:'#ef4444',fillOp:0.12,strokeOp:0.75,w:2},
      {mult:1.7,fill:'#f97316',fillOp:0.07,strokeOp:0.55,w:1.5},
      {mult:2.9,fill:'#f97316',fillOp:0.04,strokeOp:0.35,w:1},
      {mult:4.5,fill:'#fbbf24',fillOp:0.02,strokeOp:0.18,w:0.8},
    ]
    const circles=rings.map(r=>L.circle(FLOOD_CENTER,{radius:r.mult*1000,color:r.fill,fillColor:r.fill,fillOpacity:r.fillOp,weight:r.w,opacity:r.strokeOp,interactive:false}).addTo(m))
    let phase=0
    const id=setInterval(()=>{
      phase+=0.03
      const base=900+(timelineRef.current/100)*6500
      circles.forEach((c,i)=>{
        const r=rings[i].mult*base*(1+Math.sin(phase+i*1.3)*0.18)
        c.setRadius(r)
      })
    },60)
    return ()=>{ clearInterval(id); circles.forEach(c=>{ try{c.remove()}catch{} }) }
  },[floodActive])
}

// ─── Public Map ───────────────────────────────────────────────────────────────
interface PublicMapProps {
  timeline:number; schools:Place[]; hospitals:Place[]
  routes:EvacRoute[]; floodActive:boolean
  userLoc:[number,number]|null; showHospitals:boolean; showSafehouses:boolean
  showWeather:boolean; weatherPath:string|null; satPath:string|null
  pickingLoc:boolean; onMapClick:(lat:number,lng:number)=>void
}
function PublicMap(p:PublicMapProps) {
  const divRef=useRef<HTMLDivElement>(null)
  const map=useRef<L.Map|null>(null)
  const timelineRef=useRef(p.timeline)
  const hospCluster=useRef<L.MarkerClusterGroup|null>(null)
  const schoolCluster=useRef<L.MarkerClusterGroup|null>(null)
  const routeGrp=useRef<L.LayerGroup|null>(null)
  const weatherLayer=useRef<L.TileLayer|null>(null)
  const prevWx=useRef<string|null>(null)
  const userMarker=useRef<L.Marker|null>(null)
  const clickHandler=useRef<((e:L.LeafletMouseEvent)=>void)|null>(null)

  useEffect(()=>{ timelineRef.current=p.timeline },[p.timeline])
  useFloodCircles(map, p.floodActive, timelineRef)

  useEffect(()=>{
    if (!divRef.current||map.current) return
    const m=L.map(divRef.current,{center:CENTER,zoom:12,zoomControl:false})
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19,attribution:'© OpenStreetMap © CARTO'}).addTo(m)
    L.control.zoom({position:'bottomright'}).addTo(m)
    L.control.scale({position:'bottomright',metric:true,imperial:false}).addTo(m)
    // Flood prediction zone
    const pred=buildPredZone()
    L.polygon(pred,{color:'#f97316',fillColor:'#f97316',fillOpacity:0.06,weight:2,dashArray:'7,4',opacity:0.6,interactive:false}).addTo(m)
    L.tooltip({permanent:true,direction:'center',className:'snt-tip-warn'}).setContent('⚠ PREDICTED FLOOD ZONE').setLatLng([RIVER_LAT+0.018,76.268]).addTo(m)
    hospCluster.current=L.markerClusterGroup({maxClusterRadius:50,showCoverageOnHover:false,iconCreateFunction:(c)=>L.divIcon({html:`<div style="background:#1d4ed8;color:#fff;border:2px solid #93c5fd;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;font-family:sans-serif;box-shadow:0 0 8px rgba(96,165,250,0.5)">H${c.getChildCount()}</div>`,className:'',iconSize:[28,28],iconAnchor:[14,14]})}).addTo(m)
    schoolCluster.current=L.markerClusterGroup({maxClusterRadius:55,showCoverageOnHover:false,iconCreateFunction:(c)=>L.divIcon({html:`<div style="background:rgba(5,150,105,0.9);border:2px solid #34d399;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 0 7px rgba(52,211,153,0.4)">🏫${c.getChildCount()}</div>`,className:'',iconSize:[26,26],iconAnchor:[13,13]})}).addTo(m)
    routeGrp.current=L.layerGroup().addTo(m)
    map.current=m
    return ()=>{m.remove();map.current=null}
  },[])

  // Map click for location pick
  useEffect(()=>{
    if (!map.current) return
    if (clickHandler.current) map.current.off('click',clickHandler.current)
    if (p.pickingLoc) {
      map.current.getContainer().classList.add('snt-pick-cursor')
      clickHandler.current=(e:L.LeafletMouseEvent)=>p.onMapClick(e.latlng.lat,e.latlng.lng)
      map.current.on('click',clickHandler.current)
    } else {
      map.current.getContainer().classList.remove('snt-pick-cursor')
      clickHandler.current=null
    }
  },[p.pickingLoc])

  useEffect(()=>{
    if (!hospCluster.current) return
    hospCluster.current.clearLayers()
    if (!p.showHospitals) return
    p.hospitals.forEach(h=>L.marker([h.lat,h.lng],{icon:hospitalIcon}).bindTooltip(h.name,{className:'snt-tip',direction:'top'}).addTo(hospCluster.current!))
  },[p.hospitals,p.showHospitals])

  useEffect(()=>{
    if (!schoolCluster.current) return
    schoolCluster.current.clearLayers()
    if (!p.showSafehouses) return
    p.schools.forEach(s=>L.marker([s.lat,s.lng],{icon:schoolIcon}).bindTooltip(`SAFEHOUSE · ${s.name}`,{className:'snt-tip',direction:'top'}).addTo(schoolCluster.current!))
  },[p.schools,p.showSafehouses])

  useEffect(()=>{
    if (!routeGrp.current) return
    routeGrp.current.clearLayers()
    p.routes.forEach(r=>{
      if (!r.data) return
      const color=r.blocked?'#ef4444':r.color
      L.polyline(r.data.coords,{color,weight:5,opacity:0.85,dashArray:r.blocked?'6,5':undefined,lineCap:'round',lineJoin:'round'}).addTo(routeGrp.current!)
      const mid=r.data.coords[Math.floor(r.data.coords.length/2)]
      L.tooltip({permanent:false,className:'snt-tip-route',direction:'top'}).setContent(`${r.blocked?'⛔ BLOCKED':('→ '+r.dest.name)}<br/><b>~${r.data.duration} min · ${r.data.distance} km</b>`).setLatLng(mid).addTo(routeGrp.current!)
    })
  },[p.routes])

  const satLayer=useRef<L.TileLayer|null>(null)
  const prevSat=useRef<string|null>(null)
  useEffect(()=>{
    if (!map.current) return
    if (weatherLayer.current&&(!p.showWeather||p.weatherPath!==prevWx.current)){map.current.removeLayer(weatherLayer.current);weatherLayer.current=null}
    if (satLayer.current&&(!p.showWeather||p.satPath!==prevSat.current)){map.current.removeLayer(satLayer.current);satLayer.current=null}
    if (p.showWeather) {
      if (p.satPath&&p.satPath!==prevSat.current){
        satLayer.current=L.tileLayer(`https://tilecache.rainviewer.com${p.satPath}/256/{z}/{x}/{y}/0/1_1.png`,{opacity:0.4,tileSize:256,maxZoom:19,zIndex:195}).addTo(map.current!)
        prevSat.current=p.satPath
      }
      if (p.weatherPath&&p.weatherPath!==prevWx.current){
        weatherLayer.current=L.tileLayer(`https://tilecache.rainviewer.com${p.weatherPath}/256/{z}/{x}/{y}/8/1_1.png`,{opacity:0.75,tileSize:256,maxZoom:19,zIndex:200}).addTo(map.current!)
        prevWx.current=p.weatherPath
      }
    }
  },[p.showWeather,p.weatherPath,p.satPath])

  useEffect(()=>{
    if (!map.current) return
    if (p.userLoc) {
      if (userMarker.current){
        userMarker.current.setLatLng(p.userLoc)
        map.current.setView(p.userLoc,14,{animate:true})
        return
      }
      userMarker.current=L.marker(p.userLoc,{icon:userIcon('YOU ARE HERE')}).addTo(map.current!)
      map.current.setView(p.userLoc,14,{animate:true})
      L.circle(p.userLoc,{radius:60,color:'#3b82f6',fillColor:'#3b82f6',fillOpacity:0.15,weight:1.5,interactive:false}).addTo(map.current!)
    } else if (userMarker.current){userMarker.current.remove();userMarker.current=null}
  },[p.userLoc])

  return <><style>{MAP_TOOLTIP_CSS}</style><div ref={divRef} style={{width:'100%',height:'100%'}}/></>
}

function buildPredZone():[number,number][] {
  const s=RIVER_LAT,w=76.215,e=76.320,mid=(w+e)/2,n=s+0.030
  return [[s,w],[s+.001,w+.009],[s-.001,mid-.012],[s+.001,mid],[s,mid+.011],[s+.001,e-.009],[s,e],[n-.001,e],[n+.001,e-.010],[n,mid+.014],[n-.001,mid+.004],[n+.001,mid-.002],[n-.001,mid-.012],[n,w+.009],[n-.001,w]]
}

// ─── Public View ──────────────────────────────────────────────────────────────
function PublicView({onAdmin}:{onAdmin:()=>void}) {
  const [timeline,setTimeline]=useState(0)
  const [playing,setPlaying]=useState(false)
  const [schools,setSchools]=useState<Place[]>([])
  const [hospitals,setHospitals]=useState<Place[]>([])
  const [routes,setRoutes]=useState<EvacRoute[]>([])
  const [routesLoading,setRoutesLoading]=useState(false)
  const [weatherPath,setWeatherPath]=useState<string|null>(null)
  const [satPath,setSatPath]=useState<string|null>(null)
  const [showHospitals,setShowHospitals]=useState(true)
  const [showSafehouses,setShowSafehouses]=useState(true)
  const [showWeather,setShowWeather]=useState(false)
  const [userLoc,setUserLoc]=useState<[number,number]|null>(null)
  const [pickingLoc,setPickingLoc]=useState(false)
  const intervalRef=useRef<ReturnType<typeof setInterval>|null>(null)

  const t=timeline/100
  const fp=floodProgress(t)
  const floodActive=fp>0
  // ETA is simulation-time based, not real-time clock
  const etaSec=floodActive?0:Math.round((0.15-t)*24*3600)
  const etaH=Math.floor(etaSec/3600),etaM=Math.floor((etaSec%3600)/60),etaS=Math.floor(etaSec%60)
  const etaColor=etaSec<1800?'#ef4444':etaSec<7200?'#fbbf24':'#f97316'
  const simH=Math.floor(t*24),simM=Math.floor((t*24%1)*60)

  useEffect(()=>{
    fetchPlaces().then(({schools:sc,hospitals:ho})=>{setSchools(sc);setHospitals(ho)})
    fetchRainViewer().then(({radar,satellite})=>{setWeatherPath(radar);setSatPath(satellite)})
  },[])

  // Route computation from userLoc or EVAC_ORIGIN
  const recomputeRoutes=useCallback(async(origin:[number,number],sc:Place[])=>{
    if (!sc.length) return
    setRoutesLoading(true)
    const sorted=[...sc].sort((a,b)=>haversineM(origin[0],origin[1],a.lat,a.lng)-haversineM(origin[0],origin[1],b.lat,b.lng)).slice(0,6)
    const rs=await Promise.all(sorted.map(async(s,i)=>{
      const data=await fetchRoute(origin,[s.lat,s.lng])
      return {id:`pr${i}`,dest:{name:s.name,lat:s.lat,lng:s.lng},data,color:ROUTE_COLORS[i],blocked:false,type:'evac' as const}
    }))
    setRoutes(rs)
    setRoutesLoading(false)
  },[])

  useEffect(()=>{
    if (schools.length) recomputeRoutes(userLoc||EVAC_ORIGIN,schools)
  },[schools])

  // Playback
  useEffect(()=>{
    if (playing){intervalRef.current=setInterval(()=>setTimeline(v=>{if(v>=100){setPlaying(false);return 100}return v+0.1}),80)}
    else if(intervalRef.current) clearInterval(intervalRef.current)
    return ()=>{if(intervalRef.current)clearInterval(intervalRef.current)}
  },[playing])

  const [locError,setLocError]=useState('')
  const handleLiveLocation=()=>{
    setLocError('')
    if (!navigator.geolocation){setLocError('Location not supported');return}
    navigator.geolocation.getCurrentPosition(pos=>{
      const loc:[number,number]=[pos.coords.latitude,pos.coords.longitude]
      setUserLoc(loc)
      recomputeRoutes(loc,schools)
    },(err)=>{
      setLocError(err.code===1?'Location permission denied':'Location unavailable')
      setTimeout(()=>setLocError(''),4000)
    },{ enableHighAccuracy:true,timeout:10000,maximumAge:0 })
  }

  const handleMapClick=(lat:number,lng:number)=>{
    const loc:[number,number]=[lat,lng]
    setUserLoc(loc)
    setPickingLoc(false)
    recomputeRoutes(loc,schools)
  }

  const layerBtn=(label:string,active:boolean,fn:()=>void,col:string)=>(
    <button onClick={fn} style={{padding:'7px 13px',background:active?'rgba(15,23,42,0.92)':'rgba(15,23,42,0.75)',border:`1.5px solid ${active?col:'rgba(255,255,255,0.2)'}`,color:active?'#f8fafc':'rgba(255,255,255,0.65)',fontSize:11,fontFamily:'system-ui,sans-serif',fontWeight:active?600:400,cursor:'pointer',borderRadius:3,backdropFilter:'blur(10px)',transition:'all 0.12s',display:'flex',alignItems:'center',gap:7,boxShadow:active?`0 0 8px ${col}40`:'none'}}>
      <span style={{width:7,height:7,borderRadius:1,background:active?col:'rgba(255,255,255,0.3)',display:'inline-block',flexShrink:0}}/>
      {label}
    </button>
  )

  return (
    <div style={{position:'relative',width:'100vw',height:'100vh',overflow:'hidden',background:'#0a0f1e'}}>
      <div style={{position:'absolute',inset:'0 0 46px 0'}}>
      <PublicMap timeline={timeline} schools={schools} hospitals={hospitals} routes={routes} floodActive={floodActive} userLoc={userLoc} showHospitals={showHospitals} showSafehouses={showSafehouses} showWeather={showWeather} weatherPath={weatherPath} satPath={satPath} pickingLoc={pickingLoc} onMapClick={handleMapClick}/>

      </div>{/* end map wrapper */}

      {/* Admin button — top right, bigger */}
      <div style={{position:'absolute',top:14,right:14,zIndex:800}}>
        <button onClick={onAdmin} style={{padding:'9px 18px',background:'rgba(15,23,42,0.88)',border:'1px solid rgba(100,116,139,0.5)',color:'#94a3b8',fontSize:11,fontFamily:'JetBrains Mono',fontWeight:700,cursor:'pointer',borderRadius:3,backdropFilter:'blur(8px)',letterSpacing:1.5,boxShadow:'0 2px 10px rgba(0,0,0,0.4)'}}>⚙ ADMIN</button>
      </div>

      {/* Layer toggles — top left */}
      <div style={{position:'absolute',top:14,left:14,zIndex:800,display:'flex',flexDirection:'column',gap:4}}>
        {layerBtn('HOSPITALS',showHospitals,()=>setShowHospitals(v=>!v),'#3b82f6')}
        {layerBtn('SAFEHOUSES',showSafehouses,()=>setShowSafehouses(v=>!v),'#10b981')}
        {layerBtn('WEATHER',showWeather,()=>setShowWeather(v=>!v),'#a78bfa')}
      </div>

      {/* Flood countdown — top center */}
      <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',zIndex:800,background:'rgba(8,12,26,0.88)',border:`1px solid ${floodActive?'rgba(239,68,68,0.4)':'rgba(249,115,22,0.25)'}`,borderRadius:3,padding:'8px 20px',backdropFilter:'blur(10px)',textAlign:'center'}}>
        {floodActive
          ? <div style={{fontFamily:'JetBrains Mono',fontSize:15,fontWeight:700,color:'#ef4444',letterSpacing:2}}>🌊 Flood is here</div>
          : <>
            <div style={{fontSize:8,color:'rgba(255,255,255,0.4)',letterSpacing:1,marginBottom:3}}>Flood estimated in</div>
            <div style={{fontFamily:'JetBrains Mono',fontSize:24,fontWeight:700,color:etaColor,letterSpacing:2,lineHeight:1}}>
              {String(etaH).padStart(2,'0')}:{String(etaM).padStart(2,'0')}:{String(etaS).padStart(2,'0')}
            </div>
            <div style={{fontSize:8,color:'rgba(255,255,255,0.25)',marginTop:3}}>simulation time · T+{String(simH).padStart(2,'0')}h{String(simM).padStart(2,'0')}m</div>
          </>
        }
      </div>

      {/* Location controls — bottom left */}
      <div style={{position:'absolute',bottom:54,left:14,zIndex:800,display:'flex',flexDirection:'column',gap:5}}>
        <button onClick={handleLiveLocation} style={{padding:'8px 14px',background:'rgba(37,99,235,0.85)',border:'1px solid rgba(96,165,250,0.6)',color:'#fff',fontSize:11,fontFamily:'system-ui,sans-serif',fontWeight:600,cursor:'pointer',borderRadius:3,backdropFilter:'blur(8px)',boxShadow:'0 2px 12px rgba(37,99,235,0.4)',display:'flex',alignItems:'center',gap:6}}>📡 Live location</button>
        <button onClick={()=>setPickingLoc(v=>!v)} style={{padding:'8px 14px',background:pickingLoc?'rgba(6,182,212,0.85)':'rgba(15,23,42,0.85)',border:`1.5px solid ${pickingLoc?'#22d3ee':'rgba(255,255,255,0.25)'}`,color:pickingLoc?'#fff':'rgba(255,255,255,0.8)',fontSize:11,fontFamily:'system-ui,sans-serif',fontWeight:600,cursor:'pointer',borderRadius:3,backdropFilter:'blur(8px)',boxShadow:pickingLoc?'0 2px 12px rgba(6,182,212,0.4)':'none',display:'flex',alignItems:'center',gap:6}}>
          {pickingLoc?'📍 Click map to place...':'📌 Set location'}
        </button>
      </div>

      {locError&&<div style={{position:'absolute',bottom:56,left:14,zIndex:900,background:'rgba(239,68,68,0.9)',color:'#fff',fontSize:10,padding:'5px 10px',borderRadius:3}}>⚠ {locError}</div>}

      {/* Bottom bar — simulation player + status */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:800,background:'rgba(6,9,20,0.92)',borderTop:'1px solid rgba(255,255,255,0.07)',padding:'0 14px',display:'flex',alignItems:'center',gap:12,height:46,backdropFilter:'blur(8px)'}}>
        {/* Flood time display */}
        <div style={{display:'flex',flexDirection:'column',minWidth:80}}>
          <span style={{fontSize:8,color:'rgba(255,255,255,0.3)',letterSpacing:0.5}}>Simulation</span>
          <span style={{fontSize:10,fontFamily:'JetBrains Mono',color:floodActive?'#ef4444':'rgba(255,255,255,0.6)',fontWeight:600}}>T+{String(simH).padStart(2,'0')}h {String(simM).padStart(2,'0')}m</span>
        </div>
        {/* Controls */}
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <button onClick={()=>setPlaying(v=>!v)} style={{padding:'4px 12px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'#e2e8f0',cursor:'pointer',borderRadius:2,fontSize:11,minWidth:38}}>{playing?'⏸':'▶'}</button>
          <button onClick={()=>setTimeline(v=>Math.min(100,v+8))} style={{padding:'4px 8px',background:'transparent',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.3)',cursor:'pointer',borderRadius:2,fontSize:9,fontFamily:'JetBrains Mono'}}>+8h</button>
        </div>
        {/* Scrubber */}
        <div style={{flex:1,position:'relative',height:20,display:'flex',alignItems:'center'}}>
          <div style={{position:'absolute',top:'50%',left:0,right:0,height:2,background:'rgba(255,255,255,0.07)',borderRadius:1,transform:'translateY(-50%)'}}>
            <div style={{height:'100%',width:`${timeline}%`,background:'rgba(255,255,255,0.2)',borderRadius:1,transition:playing?'none':'width 0.1s'}}/>
          </div>
          <input type="range" min={0} max={100} step={0.5} value={timeline} onChange={e=>setTimeline(parseFloat(e.target.value))} className="timeline-scrubber" style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:2,opacity:0,cursor:'pointer'}}/>
        </div>
        {/* Route/hospital count */}
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {routesLoading&&<span style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>routing…</span>}
          {routes.length>0&&!routesLoading&&<span style={{fontSize:9,color:'#10b981'}}>{routes.filter(r=>!r.blocked).length} routes</span>}
          <span style={{fontSize:9,color:'rgba(255,255,255,0.2)'}}>{hospitals.length}H · {schools.length}S</span>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Map ────────────────────────────────────────────────────────────────
interface AdminMapProps {
  timeline:number; schools:Place[]; hospitals:Place[]
  evacRoutes:EvacRoute[]; ambulanceRoutes:AmbulanceRoute[]
  obstacles:Obstacle[]; floodActive:boolean
  showHospitals:boolean; showSafehouses:boolean
  showWeather:boolean; weatherPath:string|null; satPath:string|null; weatherGrid:WeatherPoint[]
  showSoil:boolean; soilGrid:SoilPoint[]; districtBoundaries:DistrictBoundary[]
  mapMode:MapMode; quakes:QuakePoint[]
}
function AdminMap(p:AdminMapProps) {
  const divRef=useRef<HTMLDivElement>(null)
  const map=useRef<L.Map|null>(null)
  const timelineRef=useRef(p.timeline)
  const hospCluster=useRef<L.MarkerClusterGroup|null>(null)
  const schoolCluster=useRef<L.MarkerClusterGroup|null>(null)
  const routeGrp=useRef<L.LayerGroup|null>(null)
  const ambGrp=useRef<L.LayerGroup|null>(null)
  const obstGrp=useRef<L.LayerGroup|null>(null)
  const soilGrp=useRef<L.LayerGroup|null>(null)
  const wxGrp=useRef<L.LayerGroup|null>(null)
  const weatherLayer=useRef<L.TileLayer|null>(null)
  const seismicGrp=useRef<L.LayerGroup|null>(null)
  const hydroGrp=useRef<L.LayerGroup|null>(null)
  const prevWx=useRef<string|null>(null)
  const prevMode=useRef<MapMode>('normal')

  useEffect(()=>{ timelineRef.current=p.timeline },[p.timeline])
  useFloodCircles(map, p.floodActive, timelineRef)

  useEffect(()=>{
    if (!divRef.current||map.current) return
    // Dark tiles for admin — feels operational
    const m=L.map(divRef.current,{center:CENTER,zoom:11,zoomControl:false})
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19,attribution:'© OpenStreetMap © CARTO'}).addTo(m)
    L.control.zoom({position:'topright'}).addTo(m)
    L.control.scale({position:'bottomright',metric:true,imperial:false}).addTo(m)
    L.polygon(buildPredZone(),{color:'#f97316',fillColor:'#f97316',fillOpacity:0.05,weight:1.5,dashArray:'6,4',opacity:0.55,interactive:false}).addTo(m)
    L.tooltip({permanent:true,direction:'center',className:'snt-tip-warn'}).setContent('⚠ PREDICTED FLOOD ZONE').setLatLng([RIVER_LAT+0.018,76.268]).addTo(m)

    hospCluster.current=L.markerClusterGroup({maxClusterRadius:45,showCoverageOnHover:false,iconCreateFunction:(c)=>L.divIcon({html:`<div style="background:rgba(29,78,216,0.85);color:#fff;border:1.5px solid #93c5fd;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:9px;font-family:sans-serif">H${c.getChildCount()}</div>`,className:'',iconSize:[26,26],iconAnchor:[13,13]})}).addTo(m)
    schoolCluster.current=L.markerClusterGroup({maxClusterRadius:50,showCoverageOnHover:false,iconCreateFunction:(c)=>L.divIcon({html:`<div style="background:rgba(5,150,105,0.8);border:1.5px solid #34d399;border-radius:5px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:10px">🏫${c.getChildCount()}</div>`,className:'',iconSize:[24,24],iconAnchor:[12,12]})}).addTo(m)
    routeGrp.current=L.layerGroup().addTo(m)
    ambGrp.current=L.layerGroup().addTo(m)
    obstGrp.current=L.layerGroup().addTo(m)
    soilGrp.current=L.layerGroup().addTo(m)
    wxGrp.current=L.layerGroup().addTo(m)
    seismicGrp.current=L.layerGroup()
    hydroGrp.current=L.layerGroup()
    map.current=m
    return ()=>{m.remove();map.current=null}
  },[])

  // Mode switch
  useEffect(()=>{
    if (!map.current) return
    if (prevMode.current===p.mapMode) return
    prevMode.current=p.mapMode
    seismicGrp.current?.remove(); hydroGrp.current?.remove()
    soilGrp.current?.clearLayers()
    if (p.mapMode==='seismic') seismicGrp.current?.addTo(map.current!)
    else if (p.mapMode==='hydro') hydroGrp.current?.addTo(map.current!)
  },[p.mapMode])

  // Seismic
  useEffect(()=>{
    if (!seismicGrp.current) return
    seismicGrp.current.clearLayers()
    p.quakes.forEach(q=>{
      const r=Math.max(3000,q.mag*8000)
      const col=q.mag>4.5?'#ef4444':q.mag>3?'#f97316':q.mag>1.5?'#fbbf24':'#22d3ee'
      L.circle([q.lat,q.lng],{radius:r,color:col,fillColor:col,fillOpacity:0.18,weight:1.5}).addTo(seismicGrp.current!)
        .bindTooltip(`M${q.mag.toFixed(1)} · ${q.place}`,{className:'snt-tip-dark',direction:'top'})
    })
    if (!p.quakes.length) {
      // Simulated mild seismic — very low activity
      [[9.85,76.50,0.8],[10.20,76.80,1.1],[11.30,75.90,0.6],[9.50,77.20,1.4]].forEach(([lat,lng,mag])=>{
        L.circle([lat,lng],{radius:mag*5000,color:'#22d3ee',fillColor:'#22d3ee',fillOpacity:0.12,weight:1}).addTo(seismicGrp.current!)
          .bindTooltip(`M${mag} · Simulated (low activity)`,{className:'snt-tip-dark',direction:'top'})
      })
    }
  },[p.quakes,p.mapMode])

  // Hydro dams
  useEffect(()=>{
    if (!hydroGrp.current) return
    hydroGrp.current.clearLayers()
    KERALA_DAMS.forEach(d=>{
      const col=d.alert?'#ef4444':d.fillPct>75?'#f97316':'#22d3ee'
      const wallLen=0.012  // ~1.3 km wall line
      // Dam wall line (horizontal, representing the dam structure)
      L.polyline([[d.lat,d.lng-wallLen],[d.lat,d.lng+wallLen]],{color:col,weight:d.alert?4:3,opacity:0.9}).addTo(hydroGrp.current!)
      // Upstream water body — short fill bar behind wall
      const fillFrac=d.fillPct/100
      L.polyline([[d.lat+0.003,d.lng-wallLen*fillFrac],[d.lat+0.003,d.lng+wallLen*fillFrac]],{color:col,weight:6,opacity:0.35}).addTo(hydroGrp.current!)
      // Small icon marker
      L.marker([d.lat,d.lng],{icon:damIcon(d.fillPct,d.alert)}).addTo(hydroGrp.current!)
        .bindTooltip(`${d.name} — ${d.fillPct}% full · ${d.capacity} MCM${d.alert?' ⚠ HIGH':''}`,{className:'snt-tip-dark',direction:'top'})
    })
  },[p.mapMode])

  useEffect(()=>{
    if (!hospCluster.current) return
    hospCluster.current.clearLayers()
    if (!p.showHospitals) return
    p.hospitals.forEach(h=>L.marker([h.lat,h.lng],{icon:hospitalIcon}).bindTooltip(h.name,{className:'snt-tip-dark',direction:'top'}).addTo(hospCluster.current!))
  },[p.hospitals,p.showHospitals])

  useEffect(()=>{
    if (!schoolCluster.current) return
    schoolCluster.current.clearLayers()
    if (!p.showSafehouses) return
    p.schools.forEach(s=>L.marker([s.lat,s.lng],{icon:schoolIcon}).bindTooltip(`SAFEHOUSE · ${s.name}`,{className:'snt-tip-dark',direction:'top'}).addTo(schoolCluster.current!))
  },[p.schools,p.showSafehouses])

  // Evac routes — blocked routes are hidden; only open + alternate routes drawn
  useEffect(()=>{
    if (!routeGrp.current) return
    routeGrp.current.clearLayers()
    p.evacRoutes.filter(r=>!r.blocked&&r.data).forEach(r=>{
      if (!r.data) return
      const isAlt=r.id.startsWith('alt_')
      const col=isAlt?'#10b981':r.color
      const w=isAlt?5:3.5
      // Shadow layer for alt routes
      if (isAlt) L.polyline(r.data.coords,{color:'#000',weight:9,opacity:0.2,lineCap:'round',lineJoin:'round',interactive:false}).addTo(routeGrp.current!)
      L.polyline(r.data.coords,{color:col,weight:w,opacity:isAlt?0.95:0.72,lineCap:'round',lineJoin:'round'}).addTo(routeGrp.current!)
        .bindTooltip(`${isAlt?'🔀 REROUTED via roads — ':''}${r.dest.name} — ${r.data.duration}min ${r.data.distance}km`,{className:'snt-tip-dark',direction:'top',sticky:true})
    })
  },[p.evacRoutes])

  // Ambulance + transfer routes
  useEffect(()=>{
    if (!ambGrp.current) return
    ambGrp.current.clearLayers()
    p.ambulanceRoutes.forEach(ar=>{
      if (!ar.data) return
      const isTransfer=ar.id.startsWith('xfr_')
      const lineCol=isTransfer?'#a78bfa':'#f87171'
      // Shadow + main line
      L.polyline(ar.data.coords,{color:'#000',weight:9,opacity:0.2,lineCap:'round',interactive:false}).addTo(ambGrp.current!)
      L.polyline(ar.data.coords,{color:lineCol,weight:5,opacity:0.95,dashArray:'10,5',lineCap:'round'}).addTo(ambGrp.current!)
      if (isTransfer) {
        // Both ends are hospitals; mark origin as "FLOOD ZONE" and dest as "SAFE"
        L.marker([ar.from.lat,ar.from.lng],{icon:hospitalIcon}).addTo(ambGrp.current!)
          .bindTooltip(`⚠ EVACUATING · ${ar.from.name}`,{className:'snt-tip-dark',direction:'top',permanent:true})
        L.marker([ar.to.lat,ar.to.lng],{icon:hospitalIcon}).addTo(ambGrp.current!)
          .bindTooltip(`✅ RECEIVING · ${ar.to.name}`,{className:'snt-tip-dark',direction:'top',permanent:true})
      } else {
        L.marker([ar.to.lat,ar.to.lng],{icon:ambIcon}).addTo(ambGrp.current!)
          .bindTooltip(`🚑 EN ROUTE → ${ar.to.name}`,{className:'snt-tip-dark',direction:'top',permanent:true})
        L.marker([ar.from.lat,ar.from.lng],{icon:hospitalIcon}).addTo(ambGrp.current!)
      }
    })
  },[p.ambulanceRoutes])

  // Obstacles
  useEffect(()=>{
    if (!obstGrp.current) return
    obstGrp.current.clearLayers()
    p.obstacles.forEach(ob=>{
      L.marker([ob.lat,ob.lng],{icon:obstacleIcon}).bindTooltip(`⛔ ${ob.desc}`,{className:'snt-tip-dark',direction:'top',permanent:true}).addTo(obstGrp.current!)
      L.circle([ob.lat,ob.lng],{radius:250,color:'#ef4444',fillColor:'#ef4444',fillOpacity:0.1,weight:1.5,dashArray:'3,3'}).addTo(obstGrp.current!)
    })
  },[p.obstacles])

  // Soil — Kerala district polygons (real Overpass boundaries, fallback rects while loading)
  useEffect(()=>{
    if (!soilGrp.current) return
    soilGrp.current.clearLayers()
    if (!p.showSoil||!p.soilGrid.length||p.mapMode!=='normal') return

    const nearest=(cLat:number,cLng:number)=>{
      let best=p.soilGrid[0],bestD=Infinity
      p.soilGrid.forEach(pt=>{const d=(pt.lat-cLat)**2+(pt.lng-cLng)**2;if(d<bestD){bestD=d;best=pt}})
      return best
    }
    const paintPolygon=(name:string,pts:[number,number][])=>{
      const cLat=pts.reduce((s,q)=>s+q[0],0)/pts.length
      const cLng=pts.reduce((s,q)=>s+q[1],0)/pts.length
      const soil=nearest(cLat,cLng)
      const t=Math.min(1,soil.value/0.5)
      let fill='#fde68a'
      if (t>0.75) fill='#2563eb'
      else if (t>0.5) fill='#06b6d4'
      else if (t>0.25) fill='#34d399'
      L.polygon(pts,{color:'rgba(255,255,255,0.3)',fillColor:fill,fillOpacity:0.38+t*0.28,weight:1.2,interactive:true})
        .addTo(soilGrp.current!)
        .bindTooltip(`<b>${name}</b><br/>Soil moisture: ${(soil.value*100).toFixed(1)}%<br/>${t>0.6?'Saturated':t>0.35?'Moist':'Dry'}`,{className:'snt-tip-dark',direction:'top'})
    }

    if (p.districtBoundaries.length>0) {
      // Real district boundary polygons from Overpass
      p.districtBoundaries.forEach(d=>paintPolygon(d.name,d.coords))
    } else {
      // Fallback rectangular approximations while boundaries load
      const RECT_FALLBACK:[string,[number,number][]][]=[
        ['Kasaragod',[[12.78,74.89],[12.78,75.58],[12.30,75.58],[12.30,74.89]]],
        ['Kannur',[[12.30,75.20],[12.30,76.02],[11.70,76.02],[11.70,75.20]]],
        ['Wayanad',[[11.82,75.79],[11.82,76.42],[11.38,76.42],[11.38,75.79]]],
        ['Kozhikode',[[11.70,75.49],[11.70,76.12],[11.10,76.12],[11.10,75.82],[11.38,75.82],[11.38,75.49]]],
        ['Malappuram',[[11.38,75.82],[11.38,76.62],[10.68,76.62],[10.68,75.82]]],
        ['Palakkad',[[11.10,76.12],[11.10,77.02],[10.28,77.02],[10.28,76.12]]],
        ['Thrissur',[[10.68,75.95],[10.68,76.68],[10.10,76.68],[10.10,75.95]]],
        ['Ernakulam',[[10.28,76.12],[10.28,76.62],[9.80,76.62],[9.80,76.12]]],
        ['Idukki',[[10.28,76.62],[10.28,77.45],[9.50,77.45],[9.50,76.62]]],
        ['Kottayam',[[9.80,76.42],[9.80,77.02],[9.28,77.02],[9.28,76.42]]],
        ['Alappuzha',[[9.80,76.12],[9.80,76.62],[9.10,76.62],[9.10,76.12]]],
        ['Pathanamthitta',[[9.50,76.62],[9.50,77.25],[8.98,77.25],[8.98,76.62]]],
        ['Kollam',[[9.10,76.48],[9.10,77.12],[8.80,77.12],[8.80,76.48]]],
        ['Thiruvananthapuram',[[8.80,76.68],[8.80,77.42],[8.05,77.42],[8.05,76.68]]],
      ]
      RECT_FALLBACK.forEach(([name,pts])=>paintPolygon(name,pts))
    }
  },[p.showSoil,p.soilGrid,p.mapMode,p.districtBoundaries])

  // Weather grid layer intentionally removed — RainViewer + satellite tiles handle the overlay

  // Weather + satellite
  const adminSatLayer=useRef<L.TileLayer|null>(null)
  const prevAdminSat=useRef<string|null>(null)
  useEffect(()=>{
    if (!map.current) return
    if (weatherLayer.current&&(!p.showWeather||p.weatherPath!==prevWx.current)){map.current.removeLayer(weatherLayer.current);weatherLayer.current=null}
    if (adminSatLayer.current&&(!p.showWeather||p.satPath!==prevAdminSat.current)){map.current.removeLayer(adminSatLayer.current);adminSatLayer.current=null}
    if (p.showWeather) {
      if (p.satPath&&p.satPath!==prevAdminSat.current){
        adminSatLayer.current=L.tileLayer(`https://tilecache.rainviewer.com${p.satPath}/256/{z}/{x}/{y}/0/1_1.png`,{opacity:0.4,tileSize:256,maxZoom:19,zIndex:195}).addTo(map.current!)
        prevAdminSat.current=p.satPath
      }
      if (p.weatherPath&&p.weatherPath!==prevWx.current){
        weatherLayer.current=L.tileLayer(`https://tilecache.rainviewer.com${p.weatherPath}/256/{z}/{x}/{y}/8/1_1.png`,{opacity:0.75,tileSize:256,maxZoom:19,zIndex:200}).addTo(map.current!)
        prevWx.current=p.weatherPath
      }
    }
  },[p.showWeather,p.weatherPath,p.satPath])

  return <><style>{MAP_TOOLTIP_CSS}</style><div ref={divRef} style={{width:'100%',height:'100%'}}/></>
}

// ─── Admin View ───────────────────────────────────────────────────────────────
function AdminView({onLogout,onEarthquake}:{onLogout:()=>void;onEarthquake:()=>void}) {
  const [timeline,setTimeline]=useState(0)
  const [playing,setPlaying]=useState(false)
  const [schools,setSchools]=useState<Place[]>([])
  const [hospitals,setHospitals]=useState<Place[]>([])
  const [evacRoutes,setEvacRoutes]=useState<EvacRoute[]>([])
  const [ambulanceRoutes,setAmbulanceRoutes]=useState<AmbulanceRoute[]>([])
  const [obstacles,setObstacles]=useState<Obstacle[]>([])
  const [cardStatus,setCardStatus]=useState<Record<string,CardStatus>>({})
  const [soilGrid,setSoilGrid]=useState<SoilPoint[]>([])
  const [districtBoundaries,setDistrictBoundaries]=useState<DistrictBoundary[]>([])
  const [weatherGrid,setWeatherGrid]=useState<WeatherPoint[]>([])
  const [weatherPath,setWeatherPath]=useState<string|null>(null)
  const [adminSatPath,setAdminSatPath]=useState<string|null>(null)
  const [showHospitals,setShowHospitals]=useState(true)
  const [showSafehouses,setShowSafehouses]=useState(true)
  const [showWeather,setShowWeather]=useState(false)
  const [showSoil,setShowSoil]=useState(false)
  const [mapMode,setMapMode]=useState<MapMode>('normal')
  const [quakes,setQuakes]=useState<QuakePoint[]>([])
  const [routesReady,setRoutesReady]=useState(false)
  const intervalRef=useRef<ReturnType<typeof setInterval>|null>(null)

  const t=timeline/100, fp=floodProgress(t), floodActive=fp>0
  const simH=Math.floor(t*24), simM=Math.floor((t*24%1)*60)
  const stage=t<0.15?'MONITORING':t<0.4?'EARLY FLOOD':t<0.7?'EXPANDING':t<0.88?'PEAK FLOOD':'RECEDING'

  useEffect(()=>{
    fetchPlaces().then(({schools:sc,hospitals:ho})=>{setSchools(sc);setHospitals(ho)})
    fetchSoilGrid().then(setSoilGrid)
    fetchKeralaDistrictBoundaries().then(setDistrictBoundaries)
    fetchWeatherGrid().then(setWeatherGrid)
    fetchRainViewer().then(({radar,satellite})=>{setWeatherPath(radar);setAdminSatPath(satellite)})
    db.events.getAll().catch(()=>{})
  },[])

  // Load all 22 evac exit routes
  useEffect(()=>{
    if (!EVAC_EXITS.length||routesReady) return
    setRoutesReady(true)
    Promise.all(EVAC_EXITS.map(async(ex,i)=>{
      const data=await fetchRoute(EVAC_ORIGIN,[ex.lat,ex.lng])
      return {id:ex.id,dest:{name:ex.name,lat:ex.lat,lng:ex.lng},data,color:ROUTE_COLORS[i%ROUTE_COLORS.length],blocked:false,type:'evac' as const}
    })).then(rs=>setEvacRoutes(rs))
  },[routesReady])

  useEffect(()=>{
    if (mapMode==='seismic'&&!quakes.length) fetchQuakes().then(setQuakes)
  },[mapMode])

  useEffect(()=>{
    if (playing){intervalRef.current=setInterval(()=>setTimeline(v=>{if(v>=100){setPlaying(false);return 100}return v+0.12}),80)}
    else if(intervalRef.current) clearInterval(intervalRef.current)
    return ()=>{if(intervalRef.current)clearInterval(intervalRef.current)}
  },[playing])

  const setCard=(id:string,status:CardStatus)=>{
    setCardStatus(prev=>({...prev,[id]:status}))
    db.decisions.create({card_id:id,action:status,timeline_pct:Math.round(t*100)}).catch(()=>{})
  }

  const approveCard=async(card:IncidentCard)=>{
    setCard(card.id,'approved')
    if (card.type==='block'&&card.blockCoord) {
      const [lat,lng]=card.blockCoord
      const newOb:Obstacle={id:`ob_${card.id}`,lat,lng,desc:card.blockDesc||'Road blocked',affectedIds:[]}
      setObstacles(prev=>[...prev,newOb])
      // Mark routes that pass through blocked point as blocked
      const blockedRoutes = evacRoutes.filter(r=>r.data&&routeNear(r.data,lat,lng,350)&&!r.blocked)
      setEvacRoutes(prev=>prev.map(r=>{
        if (!r.data||r.blocked) return r
        return routeNear(r.data,lat,lng,350)?{...r,blocked:true}:r
      }))
      // Compute alternate routes around the block — use two via points to force OSRM off the blocked road
      // Via points are placed perpendicular to the route, 900m+ away from the obstacle on both sides
      const detours:[[number,number],[number,number],string][] = [
        [[lat+0.008,lng-0.010],[lat+0.006,lng+0.010],'NW-NE'],
        [[lat-0.008,lng-0.010],[lat-0.006,lng+0.010],'SW-SE'],
        [[lat+0.010,lng+0.012],[lat-0.010,lng+0.012],'E'],
        [[lat+0.010,lng-0.012],[lat-0.010,lng-0.012],'W'],
      ]
      for (const bRoute of blockedRoutes.slice(0,4)) {
        let found=false
        for (const [via1, via2, dir] of detours) {
          if (found) break
          try {
            const ctrl=new AbortController(); setTimeout(()=>ctrl.abort(),10000)
            // Two via waypoints to force a wider detour around the blocked point
            const url=`https://router.project-osrm.org/route/v1/driving/${EVAC_ORIGIN[1]},${EVAC_ORIGIN[0]};${via1[1]},${via1[0]};${via2[1]},${via2[0]};${bRoute.dest.lng},${bRoute.dest.lat}?overview=full&geometries=geojson`
            const res=await fetch(url,{signal:ctrl.signal})
            const d=await res.json()
            if (d.code==='Ok'&&d.routes?.[0]) {
              const r=d.routes[0]
              // Only accept if the detour route does NOT pass near the blocked point
              const altCoords=(r.geometry.coordinates as [number,number][]).map(([ln,la])=>[la,ln] as [number,number])
              const altData:RouteData={coords:altCoords,duration:Math.ceil(r.duration/60),distance:parseFloat((r.distance/1000).toFixed(1))}
              if (!routeNear(altData,lat,lng,250)) {
                setEvacRoutes(prev=>[...prev,{id:`alt_${bRoute.id}_${dir}`,dest:bRoute.dest,data:altData,color:'#10b981',blocked:false,type:'evac' as const}])
                found=true
              }
            }
          } catch {}
        }
      }
      db.obstacles.create({lat,lng,description:card.blockDesc||'blocked',affected_route_count:blockedRoutes.length,raw_input:card.title}).catch(()=>{})
    }
    if (card.type==='ambulance'&&card.incidentCoord&&card.hospitalId) {
      const hosp=FALLBACK_HOSPITALS.find(h=>h.id===card.hospitalId)||FALLBACK_HOSPITALS[0]
      const data=await fetchRoute([hosp.lat,hosp.lng],card.incidentCoord)
      const ar:AmbulanceRoute={id:`amb_${card.id}`,from:{name:hosp.name,lat:hosp.lat,lng:hosp.lng},to:{name:`Incident (${card.incidentCoord[0].toFixed(4)},${card.incidentCoord[1].toFixed(4)})`,lat:card.incidentCoord[0],lng:card.incidentCoord[1]},data}
      setAmbulanceRoutes(prev=>[...prev,ar])
    }
    if (card.type==='transfer'&&card.fromHospitalId&&card.toHospitalId) {
      const from=FALLBACK_HOSPITALS.find(h=>h.id===card.fromHospitalId)||FALLBACK_HOSPITALS[0]
      const to=FALLBACK_HOSPITALS.find(h=>h.id===card.toHospitalId)||FALLBACK_HOSPITALS[1]
      const data=await fetchRoute([from.lat,from.lng],[to.lat,to.lng])
      const ar:AmbulanceRoute={id:`xfr_${card.id}`,from:{name:from.name,lat:from.lat,lng:from.lng},to:{name:to.name,lat:to.lat,lng:to.lng},data}
      setAmbulanceRoutes(prev=>[...prev,ar])
    }
  }

  const layerBtn=(label:string,active:boolean,fn:()=>void,col='#06b6d4')=>(
    <button onClick={fn} style={{width:'100%',padding:'6px 9px',marginBottom:2,background:active?'rgba(255,255,255,0.07)':'transparent',border:`1px solid ${active?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.07)'}`,color:active?'#e2e8f0':'rgba(255,255,255,0.35)',fontSize:10.5,fontFamily:'system-ui,sans-serif',fontWeight:active?500:400,cursor:'pointer',borderRadius:2,transition:'all 0.1s',textAlign:'left',display:'flex',alignItems:'center',gap:7}}>
      <span style={{width:7,height:7,borderRadius:1,background:active?col:'rgba(255,255,255,0.15)',flexShrink:0,display:'inline-block'}}/>
      {label}
    </button>
  )

  const modeBtn=(mode:MapMode,label:string,col:string)=>(
    <button onClick={()=>setMapMode(m=>m===mode?'normal':mode)} style={{width:'100%',padding:'6px 9px',marginBottom:2,background:mapMode===mode?'rgba(255,255,255,0.08)':'transparent',border:`1px solid ${mapMode===mode?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.07)'}`,color:mapMode===mode?'#e2e8f0':'rgba(255,255,255,0.3)',fontSize:10.5,fontFamily:'system-ui,sans-serif',fontWeight:mapMode===mode?500:400,cursor:'pointer',borderRadius:2,transition:'all 0.1s',textAlign:'left',display:'flex',alignItems:'center',gap:7}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:mapMode===mode?col:'rgba(255,255,255,0.12)',flexShrink:0,display:'inline-block'}}/>
      {label}
    </button>
  )

  const incidentCards=INCIDENT_CARDS.filter(c=>{
    if (c.type==='transfer'&&t<0.02) return false   // appears very early, pre-flood
    if (c.type==='block'&&t<0.15) return false
    if (c.type==='ambulance'&&t<0.3) return false
    return true
  })

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',width:'100vw',background:'#060b18',fontFamily:'Inter,sans-serif',overflow:'hidden'}}>
      {/* Main row: left panel + map + right sidebar */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left panel — layer controls, no simulation */}
        <div style={{width:152,flexShrink:0,background:'rgba(5,8,20,0.97)',borderRight:'1px solid rgba(255,255,255,0.07)',padding:'16px 11px 10px',display:'flex',flexDirection:'column',overflowY:'auto',gap:0}}>
          <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.55)',marginBottom:14,letterSpacing:0.2}}>Map controls</div>
          <div style={{fontSize:8.5,color:'rgba(255,255,255,0.2)',marginBottom:6,fontWeight:500,letterSpacing:0.5,textTransform:'uppercase'}}>Markers</div>
          {layerBtn('Hospitals',showHospitals,()=>setShowHospitals(v=>!v),'#3b82f6')}
          {layerBtn('Safehouses',showSafehouses,()=>setShowSafehouses(v=>!v),'#10b981')}

          <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'10px 0'}}/>
          <div style={{fontSize:8.5,color:'rgba(255,255,255,0.2)',marginBottom:6,fontWeight:500,letterSpacing:0.5,textTransform:'uppercase'}}>View</div>
          {modeBtn('seismic','Seismic','#f97316')}
          {modeBtn('hydro','Hydro / Dams','#22d3ee')}
          {layerBtn('Weather radar',showWeather,()=>setShowWeather(v=>!v),'#a78bfa')}
          {layerBtn('Soil moisture',showSoil,()=>setShowSoil(v=>!v),'#34d399')}

          <div style={{marginTop:'auto',paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',flexDirection:'column',gap:4}}>
            <button onClick={onEarthquake} style={{display:'block',width:'100%',padding:'7px 9px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.3)',color:'rgba(239,68,68,0.8)',fontSize:10.5,fontFamily:'system-ui,sans-serif',fontWeight:600,cursor:'pointer',borderRadius:2,textAlign:'left',letterSpacing:0.3}}>
              ⚡ Earthquake Sim
            </button>
            <button onClick={onLogout} style={{display:'block',width:'100%',padding:'6px 9px',background:'transparent',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.22)',fontSize:10.5,fontFamily:'system-ui,sans-serif',cursor:'pointer',borderRadius:2,textAlign:'left'}}>
              ← Log out
            </button>
          </div>
        </div>

        {/* Map */}
        <div style={{flex:1,position:'relative',overflow:'hidden'}}>
          <AdminMap timeline={timeline} schools={schools} hospitals={hospitals} evacRoutes={evacRoutes} ambulanceRoutes={ambulanceRoutes} obstacles={obstacles} floodActive={floodActive} showHospitals={showHospitals} showSafehouses={showSafehouses} showWeather={showWeather} weatherPath={weatherPath} satPath={adminSatPath} weatherGrid={weatherGrid} showSoil={showSoil} soilGrid={soilGrid} districtBoundaries={districtBoundaries} mapMode={mapMode} quakes={quakes}/>

          {/* Map mode badge */}
          {mapMode!=='normal'&&(
            <div style={{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',zIndex:800,background:'rgba(6,9,20,0.82)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:2,padding:'4px 14px',backdropFilter:'blur(8px)'}}>
              <span style={{fontFamily:'system-ui,sans-serif',fontSize:10,fontWeight:500,color:mapMode==='seismic'?'#f97316':'#22d3ee'}}>{mapMode==='seismic'?'Seismic activity':'Hydro / dam status'}</span>
            </div>
          )}

          {/* Route/ambulance status */}
          <div style={{position:'absolute',bottom:8,left:8,zIndex:800,background:'rgba(6,9,20,0.82)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:2,padding:'4px 10px',backdropFilter:'blur(6px)',display:'flex',gap:14,alignItems:'center'}}>
            <span style={{fontSize:9.5,color:evacRoutes.some(r=>r.blocked)?'#f97316':'#10b981'}}>
              {evacRoutes.filter(r=>!r.blocked).length}/{evacRoutes.length} exit routes clear
            </span>
            {obstacles.length>0&&<span style={{fontSize:9.5,color:'#ef4444'}}>⛔ {obstacles.length} blocked</span>}
            {ambulanceRoutes.length>0&&<span style={{fontSize:9.5,color:'#f87171'}}>🚑 {ambulanceRoutes.length} dispatched</span>}
          </div>
        </div>

      {/* Right sidebar — decision queue */}
      <div style={{width:256,flexShrink:0,background:'rgba(6,9,20,0.97)',borderLeft:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',overflowY:'hidden'}}>
        <div style={{padding:'14px 13px 10px',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
          <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.75)',letterSpacing:-0.2}}>Incidents</div>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',marginTop:3,display:'flex',gap:8}}>
            <span style={{color:incidentCards.length>0?'rgba(249,115,22,0.8)':'rgba(255,255,255,0.28)'}}>{incidentCards.length} active</span>
            <span style={{color:'rgba(255,255,255,0.15)'}}>·</span>
            <span>{incidentCards.filter(c=>cardStatus[c.id]==='approved').length} actioned</span>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'10px 10px'}}>
          {incidentCards.length===0&&(
            <div style={{padding:'24px 10px',textAlign:'center',color:'rgba(255,255,255,0.2)',fontSize:10,fontFamily:'JetBrains Mono',border:'1px dashed rgba(255,255,255,0.07)',borderRadius:4}}>
              No active incidents<br/>
              <span style={{fontSize:8,color:'rgba(255,255,255,0.12)'}}>advance timeline to simulate</span>
            </div>
          )}
          {incidentCards.map(card=>{
            const status=cardStatus[card.id]||'pending'
            const borderCol=status==='approved'?'rgba(16,185,129,0.35)':status==='rejected'?'rgba(249,115,22,0.2)':status==='reviewing'?'rgba(6,182,212,0.3)':card.type==='ambulance'?'rgba(239,68,68,0.35)':'rgba(249,115,22,0.3)'
            return (
              <div key={card.id} style={{background:'rgba(255,255,255,0.025)',border:`1px solid ${borderCol}`,borderRadius:4,padding:'9px 10px',marginBottom:8,transition:'border-color 0.2s'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                  <span style={{fontSize:13}}>{card.icon}</span>
                  <span style={{fontSize:9.5,fontWeight:700,color:'rgba(255,255,255,0.85)',flex:1,letterSpacing:0.3}}>{card.title}</span>
                  <span style={{fontSize:7.5,fontFamily:'JetBrains Mono',color:card.tagColor,border:`1px solid ${card.tagColor}40`,borderRadius:2,padding:'1px 4px',fontWeight:700}}>{card.tag}</span>
                </div>
                <div style={{fontSize:9.5,color:'rgba(255,255,255,0.45)',lineHeight:1.6,marginBottom:8}}>{card.body}</div>
                {status==='approved'&&<div style={{fontSize:9,color:'#10b981',borderTop:'1px solid rgba(16,185,129,0.2)',paddingTop:6,marginTop:2}}>✓ Approved{card.type==='block'?' — route marked blocked':' — ambulance dispatched'}</div>}
                {status==='rejected'&&<div style={{fontSize:9,color:'rgba(249,115,22,0.7)',borderTop:'1px solid rgba(249,115,22,0.12)',paddingTop:6,marginTop:2}}>Rejected</div>}
                {status==='reviewing'&&<div style={{fontSize:9,color:'rgba(6,182,212,0.7)',borderTop:'1px solid rgba(6,182,212,0.12)',paddingTop:6,marginTop:2}}>Under review…</div>}
                {status==='pending'&&(
                  <div style={{display:'flex',gap:5}}>
                    <button onClick={()=>approveCard(card)} style={{flex:2,padding:'5px 0',borderRadius:2,fontSize:10,fontFamily:'system-ui,sans-serif',fontWeight:500,cursor:'pointer',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.25)',color:'#6ee7b7'}}>
                      Approve
                    </button>
                    <button onClick={()=>setCard(card.id,'reviewing')} style={{flex:1,padding:'5px 0',borderRadius:2,fontSize:10,fontFamily:'system-ui,sans-serif',fontWeight:400,cursor:'pointer',background:'transparent',border:'1px solid rgba(255,255,255,0.09)',color:'rgba(255,255,255,0.3)'}}>
                      Review
                    </button>
                    <button onClick={()=>setCard(card.id,'rejected')} style={{flex:1,padding:'5px 0',borderRadius:2,fontSize:10,fontFamily:'system-ui,sans-serif',fontWeight:400,cursor:'pointer',background:'transparent',border:'1px solid rgba(255,255,255,0.09)',color:'rgba(255,255,255,0.25)'}}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Resource status */}
          <div style={{height:1,background:'rgba(255,255,255,0.05)',margin:'12px 0 8px'}}/>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.22)',marginBottom:8,letterSpacing:0.5}}>Resources</div>
          {[
            ['Medical supply','62%','#60a5fa'],
            ['Rescue boats','70%','#06b6d4'],
            ['Relief kits','45%','#10b981'],
            ['Fuel','83%','#fbbf24'],
          ].map(([l,v,c])=>(
            <div key={l} style={{marginBottom:7}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                <span style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>{l}</span>
                <span style={{fontSize:9.5,fontFamily:'JetBrains Mono',color:c}}>{v}</span>
              </div>
              <div style={{height:2,background:'rgba(255,255,255,0.06)',borderRadius:1}}>
                <div style={{height:'100%',width:v,background:c,borderRadius:1}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      </div>{/* end main row */}

      {/* Bottom simulation bar */}
      <div style={{height:64,flexShrink:0,background:'rgba(6,9,20,0.98)',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',padding:'0 16px',gap:16,zIndex:100}}>
        {/* Stage + BIG time */}
        <div style={{display:'flex',flexDirection:'column',minWidth:160}}>
          <span style={{fontSize:9,color:floodActive?'#ef4444':'#f97316',fontWeight:600,letterSpacing:0.5}}>{floodActive?'🌊 ':''}{stage}</span>
          <span style={{fontSize:28,fontFamily:'JetBrains Mono',color:floodActive?'#ef4444':'rgba(255,255,255,0.85)',fontWeight:700,lineHeight:1.1,letterSpacing:2}}>T+{String(simH).padStart(2,'0')}h{String(simM).padStart(2,'0')}m</span>
        </div>
        {/* Play/pause + skip */}
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <button onClick={()=>setTimeline(v=>Math.max(0,v-10))} style={{padding:'4px 7px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.35)',cursor:'pointer',borderRadius:2,fontSize:11}}>⏮</button>
          <button onClick={()=>setPlaying(v=>!v)} style={{padding:'4px 12px',background:playing?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.15)',color:'#e2e8f0',cursor:'pointer',borderRadius:2,fontSize:11,minWidth:38}}>{playing?'⏸':'▶'}</button>
          <button onClick={()=>setTimeline(v=>Math.min(100,v+10))} style={{padding:'4px 7px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.35)',cursor:'pointer',borderRadius:2,fontSize:9,fontFamily:'JetBrains Mono'}}>+10</button>
          <button onClick={()=>{setTimeline(0);setPlaying(false);setObstacles([]);setEvacRoutes([]);setRoutesReady(false);setAmbulanceRoutes([])}} style={{padding:'4px 7px',background:'transparent',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.2)',cursor:'pointer',borderRadius:2,fontSize:9,fontFamily:'JetBrains Mono'}}>↺</button>
        </div>
        {/* Timeline scrubber */}
        <div style={{flex:1,position:'relative',height:24,display:'flex',alignItems:'center'}}>
          <div style={{position:'absolute',top:'50%',left:0,right:0,height:3,background:'rgba(255,255,255,0.07)',borderRadius:1,transform:'translateY(-50%)'}}>
            <div style={{height:'100%',width:`${timeline}%`,background:'rgba(255,255,255,0.25)',borderRadius:1,transition:playing?'none':'width 0.1s'}}/>
          </div>
          {[{p:0,l:'Start'},{p:15,l:'Flood'},{p:50,l:'+12h'},{p:75,l:'Peak'},{p:100,l:'T+24'}].map(m=>(
            <div key={m.p} style={{position:'absolute',left:`${m.p}%`,transform:'translateX(-50%)',top:0,textAlign:'center',pointerEvents:'none'}}>
              <div style={{width:1,height:6,background:'rgba(255,255,255,0.15)',margin:'0 auto'}}/>
              <div style={{fontSize:7,color:'rgba(255,255,255,0.2)',fontFamily:'JetBrains Mono',whiteSpace:'nowrap',marginTop:1}}>{m.l}</div>
            </div>
          ))}
          <input type="range" min={0} max={100} step={0.5} value={timeline} onChange={e=>setTimeline(parseFloat(e.target.value))} className="timeline-scrubber" style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:2,opacity:0,cursor:'pointer'}}/>
        </div>
        <span style={{fontSize:9,fontFamily:'JetBrains Mono',color:'rgba(255,255,255,0.2)',minWidth:50,textAlign:'right'}}>{Math.round(timeline)}%</span>
      </div>

    </div>
  )
}

// ─── Earthquake simulation helpers ───────────────────────────────────────────
// ─── Delhi earthquake constants (Seismic Zone IV) ─────────────────────────────
const EQ_CENTER:[number,number]=[28.7041,77.1025]  // epicentre — Delhi Ridge fault, Rohini sector
const DELHI_CENTER:[number,number]=[28.6139,77.2090]  // map view anchor (Connaught Place)

// Delhi fallback hospitals (20 major hospitals)
const DELHI_FALLBACK_HOSPITALS:Place[]=[
  {id:'dh01',name:'AIIMS New Delhi',lat:28.5672,lng:77.2100,type:'hospital'},
  {id:'dh02',name:'Safdarjung Hospital',lat:28.5691,lng:77.2068,type:'hospital'},
  {id:'dh03',name:'RML Hospital',lat:28.6273,lng:77.2079,type:'hospital'},
  {id:'dh04',name:'GTB Hospital Dilshad Garden',lat:28.6881,lng:77.3078,type:'hospital'},
  {id:'dh05',name:'DDU Hospital Hari Nagar',lat:28.6417,lng:77.0916,type:'hospital'},
  {id:'dh06',name:'Lok Nayak Hospital',lat:28.6380,lng:77.2297,type:'hospital'},
  {id:'dh07',name:'Sir Ganga Ram Hospital',lat:28.6416,lng:77.1851,type:'hospital'},
  {id:'dh08',name:'BLK Super Speciality',lat:28.6398,lng:77.1834,type:'hospital'},
  {id:'dh09',name:'Fortis Shalimar Bagh',lat:28.7178,lng:77.1574,type:'hospital'},
  {id:'dh10',name:'Max Super Speciality Saket',lat:28.5265,lng:77.2167,type:'hospital'},
  {id:'dh11',name:'Indraprastha Apollo',lat:28.5469,lng:77.2898,type:'hospital'},
  {id:'dh12',name:'Hindu Rao Hospital',lat:28.6730,lng:77.2079,type:'hospital'},
  {id:'dh13',name:'Sushruta Trauma Centre',lat:28.6739,lng:77.2072,type:'hospital'},
  {id:'dh14',name:'Lady Hardinge Medical College',lat:28.6378,lng:77.2103,type:'hospital'},
  {id:'dh15',name:'Rajiv Gandhi Super Speciality',lat:28.5884,lng:77.3177,type:'hospital'},
  {id:'dh16',name:'Maulana Azad Medical College',lat:28.6419,lng:77.2309,type:'hospital'},
  {id:'dh17',name:'ESIC Hospital Rohini',lat:28.7267,lng:77.1178,type:'hospital'},
  {id:'dh18',name:'Baba Saheb Ambedkar Hospital',lat:28.7108,lng:77.0978,type:'hospital'},
  {id:'dh19',name:'Deep Chand Bandhu Hospital',lat:28.7320,lng:77.1620,type:'hospital'},
  {id:'dh20',name:'Sanjay Gandhi Memorial Hospital',lat:28.7011,lng:77.1033,type:'hospital'},
]
// Delhi fallback schools (used as shelters)
const DELHI_FALLBACK_SCHOOLS:Place[]=[
  {id:'ds01',name:'Kendriya Vidyalaya RK Puram',lat:28.5677,lng:77.1812,type:'school'},
  {id:'ds02',name:'Springdales School Dhaula Kuan',lat:28.5947,lng:77.1679,type:'school'},
  {id:'ds03',name:'Modern School Barakhamba',lat:28.6298,lng:77.2232,type:'school'},
  {id:'ds04',name:'Delhi Public School RK Puram',lat:28.5632,lng:77.1832,type:'school'},
  {id:'ds05',name:'St Columba School Ashoka Road',lat:28.6345,lng:77.2219,type:'school'},
  {id:'ds06',name:'Bal Bharati Pitampura',lat:28.7026,lng:77.1309,type:'school'},
  {id:'ds07',name:'CRPF Public School Rohini',lat:28.7415,lng:77.0978,type:'school'},
  {id:'ds08',name:'Govt Sarvodaya Vidyalaya Rohini',lat:28.7208,lng:77.1174,type:'school'},
  {id:'ds09',name:'Salwan Public School Rajendra Nagar',lat:28.6497,lng:77.1752,type:'school'},
  {id:'ds10',name:'Amity International Saket',lat:28.5239,lng:77.2143,type:'school'},
  {id:'ds11',name:'Ryan International School Vasant Kunj',lat:28.5198,lng:77.1557,type:'school'},
  {id:'ds12',name:'Govt Boys Sr Sec School Karol Bagh',lat:28.6514,lng:77.1908,type:'school'},
]

async function fetchDelhiPlaces():Promise<{hospitals:Place[];schools:Place[]}> {
  const r=100000
  async function overpassQ(q:string):Promise<Place[]> {
    try {
      const ctrl=new AbortController();setTimeout(()=>ctrl.abort(),18000)
      const res=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:`data=${encodeURIComponent(q)}`,signal:ctrl.signal})
      const d=await res.json()
      return (d.elements||[]).filter((e:Record<string,unknown>)=>e.lat||e.center).map((e:Record<string,unknown>)=>{
        const lat=(e.lat||(e.center as Record<string,number>)?.lat) as number
        const lng=(e.lon||(e.center as Record<string,number>)?.lon) as number
        const tags=e.tags as Record<string,string>
        return {id:`dl_${e.id}`,name:tags?.name||'Unnamed',lat,lng,type:(tags?.amenity==='hospital'?'hospital':'school') as 'hospital'|'school'}
      })
    } catch { return [] }
  }
  const [lH,lS]=await Promise.all([
    overpassQ(`[out:json][timeout:25];(node[amenity=hospital](around:${r},${EQ_CENTER[0]},${EQ_CENTER[1]});way[amenity=hospital](around:${r},${EQ_CENTER[0]},${EQ_CENTER[1]}););out center;`),
    overpassQ(`[out:json][timeout:25];(node[amenity=school](around:${r},${EQ_CENTER[0]},${EQ_CENTER[1]});way[amenity=school](around:${r},${EQ_CENTER[0]},${EQ_CENTER[1]}););out center;`),
  ])
  return {
    hospitals:mergeUnique(lH,DELHI_FALLBACK_HOSPITALS),
    schools:mergeUnique(lS,DELHI_FALLBACK_SCHOOLS),
  }
}

const EQ_EXITS=[
  // NH 44 North (Delhi–Chandigarh)
  {id:'eq01',name:'NH 44 Sonipat Exit',lat:28.9931,lng:77.0151},
  {id:'eq02',name:'NH 44 Panipat Relief',lat:29.3909,lng:76.9635},
  // NH 58 Northeast (Delhi–Haridwar)
  {id:'eq03',name:'NH 58 Ghaziabad Exit',lat:28.6692,lng:77.4538},
  {id:'eq04',name:'NH 58 Meerut Assembly',lat:28.9845,lng:77.7064},
  // NH 9 East (Delhi–Lucknow)
  {id:'eq05',name:'NH 9 Noida Sector 62',lat:28.6272,lng:77.3649},
  {id:'eq06',name:'NH 9 Greater Noida',lat:28.4744,lng:77.5040},
  // South (NH 48 Delhi–Jaipur)
  {id:'eq07',name:'NH 48 Gurgaon Exit',lat:28.4595,lng:77.0266},
  {id:'eq08',name:'NH 48 Manesar Ground',lat:28.3673,lng:76.9381},
  // West (NH 10 Delhi–Rohtak)
  {id:'eq09',name:'NH 10 Bahadurgarh Camp',lat:28.6914,lng:76.9220},
  {id:'eq10',name:'NH 10 Rohtak Assembly',lat:28.8955,lng:76.5673},
  // Inner city relief zones
  {id:'eq11',name:'Yamuna Sports Complex',lat:28.6431,lng:77.2693},
  {id:'eq12',name:'Jawaharlal Nehru Stadium',lat:28.5827,lng:77.2330},
  {id:'eq13',name:'Ramlila Ground',lat:28.6432,lng:77.2305},
  {id:'eq14',name:'Pragati Maidan',lat:28.6182,lng:77.2455},
  {id:'eq15',name:'Indira Gandhi Airport Safety',lat:28.5562,lng:77.1000},
]
interface EqCard {
  id:string; icon:string; title:string; tag:string; tagColor:string; body:string
  type:'rescue'|'structural'|'medical'|'evacorder'
  coord?:[number,number]; hospitalId?:string; showAtPct:number
}
const EQ_INCIDENT_CARDS:EqCard[]=[
  {id:'eq_inc02',icon:'🏗',title:'RESIDENTIAL COLLAPSE',tag:'ROHINI',tagColor:'#ef4444',
   body:'6-storey residential block at Rohini Sector 7 (28.7201, 77.1189) has partially collapsed. ~20 residents trapped under rubble. NDRF deployment required immediately.',
   type:'rescue',coord:[28.7201,77.1189],hospitalId:'dh09',showAtPct:10},
  {id:'eq_inc03',icon:'🌉',title:'YAMUNA BRIDGE ALERT',tag:'ITO BRIDGE',tagColor:'#f97316',
   body:'ITO Yamuna Bridge (28.6285, 77.2441) showing structural deformation. Engineer inspection deployed. All vehicles to be diverted to NH 24 Signature Bridge.',
   type:'structural',coord:[28.6285,77.2441],showAtPct:22},
  {id:'eq_inc04',icon:'⚡',title:'GAS PIPELINE RUPTURE',tag:'UTILITY',tagColor:'#f97316',
   body:'HT gas main ruptured near Azadpur vegetable market (28.7069, 77.1756). Evacuation of 500m radius underway. Fire brigade and IGL crew on site.',
   type:'structural',coord:[28.7069,77.1756],showAtPct:18},
  {id:'eq_inc05',icon:'🚇',title:'METRO INFRASTRUCTURE DAMAGE',tag:'YELLOW LINE',tagColor:'#fbbf24',
   body:'Yellow Line metro viaduct between Rohini East and Rithala (28.7340, 77.1170) shows pillar cracks. DMRC halting operations. 3 trains to be evacuated at nearest station.',
   type:'structural',coord:[28.7340,77.1170],showAtPct:15},
  {id:'eq_inc06',icon:'🚑',title:'CHANDNI CHOWK MASS CASUALTY',tag:'AMBULANCE',tagColor:'#ef4444',
   body:'Market building collapse at Chandni Chowk (28.6506, 77.2295). 34 injured, 9 critical. Old Delhi heritage structures at extreme risk. Dispatch from Hindu Rao Hospital.',
   type:'rescue',coord:[28.6506,77.2295],hospitalId:'dh12',showAtPct:30},
]

function eqShakingProgress(t:number):number {
  if (t<0.05) return 0
  if (t<0.15) return (t-0.05)/0.10  // ramp up
  if (t<0.45) return 1.0             // peak shaking
  if (t<0.75) return 1-(t-0.45)/0.30 // aftershock decay
  return Math.max(0,0.3-(t-0.75)*2)
}

// Earthquake map component
interface EqMapProps {
  timeline:number; hospitals:Place[]; schools:Place[]
  eqRoutes:EvacRoute[]; eqAmbRoutes:AmbulanceRoute[]
  showHospitals:boolean; showSafehouses:boolean
  obstacles:Obstacle[]
}
function EarthquakeMap(p:EqMapProps) {
  const divRef=useRef<HTMLDivElement>(null)
  const map=useRef<L.Map|null>(null)
  const hospCluster=useRef<L.MarkerClusterGroup|null>(null)
  const schoolCluster=useRef<L.MarkerClusterGroup|null>(null)
  const routeGrp=useRef<L.LayerGroup|null>(null)
  const ambGrp=useRef<L.LayerGroup|null>(null)
  const shakeGrp=useRef<L.LayerGroup|null>(null)
  const eqObstGrp=useRef<L.LayerGroup|null>(null)
  const timelineRef=useRef(p.timeline)
  const shakeIntervalRef=useRef<ReturnType<typeof setInterval>|null>(null)
  const shakePhaseRef=useRef(0)

  useEffect(()=>{ timelineRef.current=p.timeline },[p.timeline])

  useEffect(()=>{
    if (!divRef.current||map.current) return
    const m=L.map(divRef.current,{center:DELHI_CENTER,zoom:11,zoomControl:false})
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19,attribution:'© OpenStreetMap © CARTO'}).addTo(m)
    L.control.zoom({position:'topright'}).addTo(m)
    L.control.scale({position:'bottomright',metric:true,imperial:false}).addTo(m)
    hospCluster.current=L.markerClusterGroup({maxClusterRadius:45,showCoverageOnHover:false,iconCreateFunction:(c)=>L.divIcon({html:`<div style="background:rgba(29,78,216,0.85);color:#fff;border:1.5px solid #93c5fd;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:9px;font-family:sans-serif">H${c.getChildCount()}</div>`,className:'',iconSize:[26,26],iconAnchor:[13,13]})}).addTo(m)
    schoolCluster.current=L.markerClusterGroup({maxClusterRadius:50,showCoverageOnHover:false,iconCreateFunction:(c)=>L.divIcon({html:`<div style="background:rgba(5,150,105,0.8);border:1.5px solid #34d399;border-radius:5px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:10px">🏫${c.getChildCount()}</div>`,className:'',iconSize:[24,24],iconAnchor:[12,12]})}).addTo(m)
    routeGrp.current=L.layerGroup().addTo(m)
    ambGrp.current=L.layerGroup().addTo(m)
    shakeGrp.current=L.layerGroup().addTo(m)
    eqObstGrp.current=L.layerGroup().addTo(m)
    // Epicentre marker — Rohini, Delhi Ridge Fault
    L.circleMarker(EQ_CENTER,{radius:9,color:'#ef4444',fillColor:'#ef4444',fillOpacity:0.9,weight:2.5}).addTo(m)
      .bindTooltip('⚠ Epicentre M5.2 · Rohini, Delhi Ridge Fault',{className:'snt-tip-dark',direction:'top',permanent:true})
    // Delhi administrative boundary hint
    L.circle(DELHI_CENTER,{radius:22000,color:'rgba(249,115,22,0.3)',fillColor:'transparent',weight:1,dashArray:'6,4',interactive:false}).addTo(m)
    map.current=m
    return ()=>{m.remove();map.current=null}
  },[])

  // Pulsing shaking rings — like flood circles but orange/red seismic rings
  useEffect(()=>{
    if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current)
    shakeIntervalRef.current=setInterval(()=>{
      if (!shakeGrp.current||!map.current) return
      shakeGrp.current.clearLayers()
      const t=timelineRef.current/100
      const intensity=eqShakingProgress(t)
      if (intensity<=0) return
      shakePhaseRef.current=(shakePhaseRef.current+0.04)%(Math.PI*2)
      const ph=shakePhaseRef.current
      const rings=[
        {base:8000,pulse:2000,col:'#ef4444',fill:0.18,stroke:0.80},
        {base:18000,pulse:4000,col:'#f97316',fill:0.10,stroke:0.55},
        {base:35000,pulse:7000,col:'#f97316',fill:0.06,stroke:0.35},
        {base:65000,pulse:10000,col:'#fbbf24',fill:0.03,stroke:0.18},
        {base:110000,pulse:15000,col:'#fbbf24',fill:0.02,stroke:0.10},
      ]
      rings.forEach(({base,pulse,col,fill,stroke},i)=>{
        const r=base+(Math.sin(ph+i*1.2)*0.5+0.5)*pulse*intensity
        L.circle(EQ_CENTER,{radius:r,color:col,fillColor:col,fillOpacity:fill*intensity,weight:1.5,opacity:stroke*intensity,interactive:false}).addTo(shakeGrp.current!)
      })
    },80)
    return ()=>{if(shakeIntervalRef.current)clearInterval(shakeIntervalRef.current)}
  },[])

  useEffect(()=>{
    if (!hospCluster.current) return
    hospCluster.current.clearLayers()
    if (!p.showHospitals) return
    p.hospitals.forEach(h=>L.marker([h.lat,h.lng],{icon:hospitalIcon}).bindTooltip(h.name,{className:'snt-tip-dark',direction:'top'}).addTo(hospCluster.current!))
  },[p.hospitals,p.showHospitals])

  useEffect(()=>{
    if (!schoolCluster.current) return
    schoolCluster.current.clearLayers()
    if (!p.showSafehouses) return
    p.schools.forEach(s=>L.marker([s.lat,s.lng],{icon:schoolIcon}).bindTooltip(`SHELTER · ${s.name}`,{className:'snt-tip-dark',direction:'top'}).addTo(schoolCluster.current!))
  },[p.schools,p.showSafehouses])

  useEffect(()=>{
    if (!routeGrp.current) return
    routeGrp.current.clearLayers()
    p.eqRoutes.filter(r=>!r.blocked&&r.data).forEach(r=>{
      if(!r.data) return
      const isAlt=r.id.startsWith('alt_')
      L.polyline(r.data.coords,{color:isAlt?'#10b981':r.color,weight:isAlt?5:3.5,opacity:isAlt?0.95:0.72,lineCap:'round',lineJoin:'round'}).addTo(routeGrp.current!)
        .bindTooltip(`${isAlt?'🔀 REROUTED — ':''}${r.dest.name} — ${r.data.duration}min`,{className:'snt-tip-dark',direction:'top',sticky:true})
    })
  },[p.eqRoutes])

  useEffect(()=>{
    if (!ambGrp.current) return
    ambGrp.current.clearLayers()
    p.eqAmbRoutes.forEach(ar=>{
      if (!ar.data) return
      L.polyline(ar.data.coords,{color:'#f87171',weight:5,opacity:0.95,dashArray:'10,5',lineCap:'round'}).addTo(ambGrp.current!)
      L.marker([ar.to.lat,ar.to.lng],{icon:ambIcon}).addTo(ambGrp.current!).bindTooltip(`🚑 → ${ar.to.name}`,{className:'snt-tip-dark',direction:'top',permanent:true})
      L.marker([ar.from.lat,ar.from.lng],{icon:hospitalIcon}).addTo(ambGrp.current!)
    })
  },[p.eqAmbRoutes])

  // Obstacles in dedicated group (shakeGrp clears every 80ms — can't use it)
  useEffect(()=>{
    if (!eqObstGrp.current) return
    eqObstGrp.current.clearLayers()
    p.obstacles.forEach(ob=>{
      L.circle([ob.lat,ob.lng],{radius:400,color:'#f97316',fillColor:'#f97316',fillOpacity:0.12,weight:2,dashArray:'6,3',interactive:false}).addTo(eqObstGrp.current!)
      L.marker([ob.lat,ob.lng],{icon:obstacleIcon}).bindTooltip(`⚠ ${ob.desc}`,{className:'snt-tip-dark',direction:'top',permanent:true}).addTo(eqObstGrp.current!)
    })
  },[p.obstacles])

  return <><style>{MAP_TOOLTIP_CSS}</style><div ref={divRef} style={{width:'100%',height:'100%'}}/></>
}

// ─── Earthquake View ──────────────────────────────────────────────────────────
function EarthquakeView({onBack}:{onBack:()=>void}) {
  const [timeline,setTimeline]=useState(0)
  const [playing,setPlaying]=useState(false)
  const [schools,setSchools]=useState<Place[]>([])
  const [hospitals,setHospitals]=useState<Place[]>([])
  const [eqRoutes,setEqRoutes]=useState<EvacRoute[]>([])
  const [eqAmbRoutes,setEqAmbRoutes]=useState<AmbulanceRoute[]>([])
  const [obstacles,setObstacles]=useState<Obstacle[]>([])
  const [cardStatus,setCardStatus]=useState<Record<string,string>>({})
  const [routesReady,setRoutesReady]=useState(false)
  const [showHospitals,setShowHospitals]=useState(true)
  const [showSafehouses,setShowSafehouses]=useState(true)
  const intervalRef=useRef<ReturnType<typeof setInterval>|null>(null)

  const t=timeline/100
  const intensity=eqShakingProgress(t)
  const quakeActive=intensity>0
  const simH=Math.floor(t*24),simM=Math.floor((t*24%1)*60)
  const stage=t<0.05?'PRE-SEISMIC':t<0.15?'MAINSHOCK':t<0.45?'ACTIVE SHAKING':t<0.75?'AFTERSHOCKS':'STABILISING'
  const etaSec=quakeActive?0:Math.max(0,Math.round((0.05-t)*24*3600))
  const etaH=Math.floor(etaSec/3600),etaM=Math.floor((etaSec%3600)/60),etaS=etaSec%60

  useEffect(()=>{
    fetchDelhiPlaces().then(({schools:sc,hospitals:ho})=>{setSchools(sc);setHospitals(ho)})
  },[])

  useEffect(()=>{
    if (!EQ_EXITS.length||routesReady) return
    setRoutesReady(true)
    Promise.all(EQ_EXITS.map(async(ex,i)=>{
      const data=await fetchRoute(EQ_CENTER,[ex.lat,ex.lng])
      return {id:ex.id,dest:{name:ex.name,lat:ex.lat,lng:ex.lng},data,color:ROUTE_COLORS[i%ROUTE_COLORS.length],blocked:false,type:'evac' as const}
    })).then(rs=>setEqRoutes(rs))
  },[routesReady])

  useEffect(()=>{
    if (playing){intervalRef.current=setInterval(()=>setTimeline(v=>{if(v>=100){setPlaying(false);return 100}return v+0.1}),80)}
    else if(intervalRef.current) clearInterval(intervalRef.current)
    return ()=>{if(intervalRef.current)clearInterval(intervalRef.current)}
  },[playing])

  const setCard=(id:string,status:string)=>setCardStatus(prev=>({...prev,[id]:status}))

  const approveCard=async(card:EqCard)=>{
    setCard(card.id,'approved')
    if ((card.type==='rescue'||card.type==='medical')&&card.coord&&card.hospitalId) {
      const hosp=DELHI_FALLBACK_HOSPITALS.find(h=>h.id===card.hospitalId)||DELHI_FALLBACK_HOSPITALS[0]
      const data=await fetchRoute([hosp.lat,hosp.lng],card.coord)
      const ar:AmbulanceRoute={id:`eq_amb_${card.id}`,from:{name:hosp.name,lat:hosp.lat,lng:hosp.lng},to:{name:`Incident ${card.coord[0].toFixed(4)},${card.coord[1].toFixed(4)}`,lat:card.coord[0],lng:card.coord[1]},data}
      setEqAmbRoutes(prev=>[...prev,ar])
    }
    if (card.type==='structural'&&card.coord) {
      const ob:Obstacle={id:`eq_ob_${card.id}`,lat:card.coord[0],lng:card.coord[1],desc:card.title,affectedIds:[]}
      setObstacles(prev=>[...prev,ob])
      const blocked=eqRoutes.filter(r=>r.data&&routeNear(r.data,card.coord![0],card.coord![1],400)&&!r.blocked)
      setEqRoutes(prev=>prev.map(r=>(!r.data||r.blocked)?r:routeNear(r.data,card.coord![0],card.coord![1],400)?{...r,blocked:true}:r))
      for (const bRoute of blocked.slice(0,3)) {
        const detours:[[number,number],[number,number],string][]=[
          [[card.coord![0]+0.008,card.coord![1]-0.010],[card.coord![0]+0.006,card.coord![1]+0.010],'NW'],
          [[card.coord![0]-0.008,card.coord![1]-0.010],[card.coord![0]-0.006,card.coord![1]+0.010],'SW'],
          [[card.coord![0]+0.010,card.coord![1]+0.012],[card.coord![0]-0.010,card.coord![1]+0.012],'E'],
        ]
        for (const [v1,v2,dir] of detours) {
          try {
            const ctrl=new AbortController();setTimeout(()=>ctrl.abort(),10000)
            const url=`https://router.project-osrm.org/route/v1/driving/${EQ_CENTER[1]},${EQ_CENTER[0]};${v1[1]},${v1[0]};${v2[1]},${v2[0]};${bRoute.dest.lng},${bRoute.dest.lat}?overview=full&geometries=geojson`
            const res=await fetch(url,{signal:ctrl.signal})
            const d=await res.json()
            if (d.code==='Ok'&&d.routes?.[0]) {
              const r=d.routes[0]
              const coords=(r.geometry.coordinates as [number,number][]).map(([ln,la])=>[la,ln] as [number,number])
              const altData:RouteData={coords,duration:Math.ceil(r.duration/60),distance:parseFloat((r.distance/1000).toFixed(1))}
              if (!routeNear(altData,card.coord![0],card.coord![1],250)) {
                setEqRoutes(prev=>[...prev,{id:`alt_${bRoute.id}_${dir}`,dest:bRoute.dest,data:altData,color:'#10b981',blocked:false,type:'evac' as const}])
                break
              }
            }
          } catch {}
        }
      }
    }
  }

  const activeCards=EQ_INCIDENT_CARDS.filter(c=>t*100>=c.showAtPct)

  const layerBtn=(label:string,active:boolean,fn:()=>void,col:string)=>(
    <button onClick={fn} style={{width:'100%',padding:'6px 9px',marginBottom:2,background:active?'rgba(255,255,255,0.07)':'transparent',border:`1px solid ${active?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.07)'}`,color:active?'#e2e8f0':'rgba(255,255,255,0.35)',fontSize:10.5,fontFamily:'system-ui,sans-serif',fontWeight:active?500:400,cursor:'pointer',borderRadius:2,transition:'all 0.1s',textAlign:'left',display:'flex',alignItems:'center',gap:7}}>
      <span style={{width:7,height:7,borderRadius:1,background:active?col:'rgba(255,255,255,0.15)',flexShrink:0,display:'inline-block'}}/>
      {label}
    </button>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',width:'100vw',background:'#080608',fontFamily:'Inter,sans-serif',overflow:'hidden'}}>
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* Left panel */}
        <div style={{width:152,flexShrink:0,background:'rgba(20,5,5,0.97)',borderRight:'1px solid rgba(239,68,68,0.1)',padding:'16px 11px 10px',display:'flex',flexDirection:'column',overflowY:'auto'}}>
          <div style={{fontSize:10,fontWeight:700,color:'rgba(239,68,68,0.75)',marginBottom:4,letterSpacing:1.5}}>SEISMIC OPS</div>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',marginBottom:2}}>Delhi NCR — Seismic Zone IV</div>
          <div style={{fontSize:8,color:'rgba(239,68,68,0.4)',marginBottom:14,fontFamily:'JetBrains Mono'}}>Delhi Ridge Fault · M5.2</div>
          <div style={{fontSize:8.5,color:'rgba(255,255,255,0.2)',marginBottom:6,fontWeight:500,letterSpacing:0.5,textTransform:'uppercase'}}>Markers</div>
          {layerBtn('Hospitals',showHospitals,()=>setShowHospitals(v=>!v),'#3b82f6')}
          {layerBtn('Shelters',showSafehouses,()=>setShowSafehouses(v=>!v),'#10b981')}
          <div style={{height:1,background:'rgba(255,255,255,0.05)',margin:'10px 0'}}/>
          {/* Intensity legend */}
          <div style={{fontSize:8.5,color:'rgba(255,255,255,0.2)',marginBottom:6,fontWeight:500,letterSpacing:0.5,textTransform:'uppercase'}}>Intensity</div>
          {[['I–III','#22d3ee','Weak'],['IV–V','#fbbf24','Moderate'],['VI–VII','#f97316','Strong'],['VIII+','#ef4444','Severe']].map(([lvl,col,desc])=>(
            <div key={lvl} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:col,flexShrink:0,display:'inline-block'}}/>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.45)'}}>{lvl} <span style={{color:'rgba(255,255,255,0.25)'}}>{desc}</span></span>
            </div>
          ))}
          <div style={{marginTop:'auto',paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            <button onClick={onBack} style={{display:'block',width:'100%',padding:'6px 9px',background:'transparent',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.22)',fontSize:10.5,fontFamily:'system-ui,sans-serif',cursor:'pointer',borderRadius:2,textAlign:'left'}}>
              ← Flood EOC
            </button>
          </div>
        </div>

        {/* Map */}
        <div style={{flex:1,position:'relative',overflow:'hidden'}}>
          <EarthquakeMap timeline={timeline} hospitals={hospitals} schools={schools} eqRoutes={eqRoutes} eqAmbRoutes={eqAmbRoutes} showHospitals={showHospitals} showSafehouses={showSafehouses} obstacles={obstacles}/>

          {/* Intensity badge */}
          <div style={{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',zIndex:800,background:'rgba(20,5,5,0.9)',border:`1px solid ${quakeActive?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`,borderRadius:3,padding:'6px 18px',backdropFilter:'blur(8px)',textAlign:'center'}}>
            {quakeActive
              ? <span style={{fontFamily:'JetBrains Mono',fontSize:12,fontWeight:700,color:'#ef4444',letterSpacing:2}}>⚡ DELHI M5.2 SHAKING — {Math.round(intensity*100)}% intensity</span>
              : <><span style={{fontSize:8,color:'rgba(255,255,255,0.3)',marginRight:8}}>Delhi mainshock in</span><span style={{fontFamily:'JetBrains Mono',fontSize:16,fontWeight:700,color:'#f97316',letterSpacing:2}}>{String(etaH).padStart(2,'0')}:{String(etaM).padStart(2,'0')}:{String(etaS).padStart(2,'0')}</span></>
            }
          </div>

          {/* Route status */}
          <div style={{position:'absolute',bottom:8,left:8,zIndex:800,background:'rgba(6,9,20,0.82)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:2,padding:'4px 10px',backdropFilter:'blur(6px)',display:'flex',gap:14,alignItems:'center'}}>
            <span style={{fontSize:9.5,color:eqRoutes.some(r=>r.blocked)?'#f97316':'#10b981'}}>
              {eqRoutes.filter(r=>!r.blocked).length}/{eqRoutes.length} evac routes clear
            </span>
            {obstacles.length>0&&<span style={{fontSize:9.5,color:'#ef4444'}}>⛔ {obstacles.length} hazards</span>}
            {eqAmbRoutes.length>0&&<span style={{fontSize:9.5,color:'#f87171'}}>🚑 {eqAmbRoutes.length} dispatched</span>}
          </div>
        </div>

        {/* Right sidebar — incident queue */}
        <div style={{width:256,flexShrink:0,background:'rgba(20,5,5,0.97)',borderLeft:'1px solid rgba(239,68,68,0.08)',display:'flex',flexDirection:'column',overflowY:'hidden'}}>
          <div style={{padding:'14px 13px 10px',borderBottom:'1px solid rgba(239,68,68,0.08)',flexShrink:0}}>
            <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.75)',letterSpacing:-0.2}}>Seismic Incidents</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',marginTop:3,display:'flex',gap:8}}>
              <span style={{color:activeCards.length>0?'rgba(239,68,68,0.8)':'rgba(255,255,255,0.28)'}}>{activeCards.length} active</span>
              <span style={{color:'rgba(255,255,255,0.15)'}}>·</span>
              <span>{activeCards.filter(c=>cardStatus[c.id]==='approved').length} actioned</span>
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'10px'}}>
            {activeCards.length===0&&(
              <div style={{padding:'24px 10px',textAlign:'center',color:'rgba(255,255,255,0.2)',fontSize:10,fontFamily:'JetBrains Mono',border:'1px dashed rgba(255,255,255,0.07)',borderRadius:4}}>
                No incidents yet<br/>
                <span style={{fontSize:8,color:'rgba(255,255,255,0.12)'}}>advance timeline to simulate</span>
              </div>
            )}
            {activeCards.map(card=>{
              const status=cardStatus[card.id]||'pending'
              const borderCol=status==='approved'?'rgba(16,185,129,0.35)':status==='rejected'?'rgba(249,115,22,0.2)':'rgba(239,68,68,0.25)'
              return (
                <div key={card.id} style={{background:'rgba(239,68,68,0.03)',border:`1px solid ${borderCol}`,borderRadius:4,padding:'9px 10px',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                    <span style={{fontSize:13}}>{card.icon}</span>
                    <span style={{fontSize:9.5,fontWeight:700,color:'rgba(255,255,255,0.85)',flex:1,letterSpacing:0.3}}>{card.title}</span>
                    <span style={{fontSize:7.5,fontFamily:'JetBrains Mono',color:card.tagColor,border:`1px solid ${card.tagColor}40`,borderRadius:2,padding:'1px 4px',fontWeight:700}}>{card.tag}</span>
                  </div>
                  <div style={{fontSize:9.5,color:'rgba(255,255,255,0.45)',lineHeight:1.6,marginBottom:8}}>{card.body}</div>
                  {status==='approved'&&<div style={{fontSize:9,color:'#10b981',borderTop:'1px solid rgba(16,185,129,0.2)',paddingTop:6}}>✓ Approved — response activated</div>}
                  {status==='rejected'&&<div style={{fontSize:9,color:'rgba(249,115,22,0.7)',borderTop:'1px solid rgba(249,115,22,0.12)',paddingTop:6}}>Rejected</div>}
                  {status==='pending'&&(
                    <div style={{display:'flex',gap:5}}>
                      <button onClick={()=>approveCard(card)} style={{flex:2,padding:'5px 0',borderRadius:2,fontSize:10,fontWeight:500,cursor:'pointer',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.25)',color:'#6ee7b7'}}>Approve</button>
                      <button onClick={()=>setCard(card.id,'rejected')} style={{flex:1,padding:'5px 0',borderRadius:2,fontSize:10,fontWeight:400,cursor:'pointer',background:'transparent',border:'1px solid rgba(255,255,255,0.09)',color:'rgba(255,255,255,0.3)'}}>Reject</button>
                    </div>
                  )}
                </div>
              )
            })}
            {/* Seismic resources */}
            <div style={{height:1,background:'rgba(255,255,255,0.05)',margin:'12px 0 8px'}}/>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.22)',marginBottom:8,letterSpacing:0.5}}>Seismic Resources</div>
            {[
              ['NDRF Teams','3/8 deployed','#ef4444'],
              ['Search & Rescue','5 units','#f97316'],
              ['Medical Teams','12 standby','#60a5fa'],
              ['Heavy machinery','2 active','#fbbf24'],
            ].map(([l,v,c])=>(
              <div key={l} style={{marginBottom:7,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:9.5,color:'rgba(255,255,255,0.4)'}}>{l}</span>
                <span style={{fontSize:9,fontFamily:'JetBrains Mono',color:c}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom simulation bar */}
      <div style={{height:64,flexShrink:0,background:'rgba(20,5,5,0.98)',borderTop:'1px solid rgba(239,68,68,0.1)',display:'flex',alignItems:'center',padding:'0 16px',gap:16,zIndex:100}}>
        <div style={{display:'flex',flexDirection:'column',minWidth:160}}>
          <span style={{fontSize:9,color:quakeActive?'#ef4444':'#f97316',fontWeight:600,letterSpacing:0.5}}>{quakeActive?'⚡ ':''}{stage}</span>
          <span style={{fontSize:28,fontFamily:'JetBrains Mono',color:quakeActive?'#ef4444':'rgba(255,255,255,0.85)',fontWeight:700,lineHeight:1.1,letterSpacing:2}}>T+{String(simH).padStart(2,'0')}h{String(simM).padStart(2,'0')}m</span>
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <button onClick={()=>setTimeline(v=>Math.max(0,v-10))} style={{padding:'4px 7px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.35)',cursor:'pointer',borderRadius:2,fontSize:11}}>⏮</button>
          <button onClick={()=>setPlaying(v=>!v)} style={{padding:'4px 12px',background:playing?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.15)',color:'#e2e8f0',cursor:'pointer',borderRadius:2,fontSize:11,minWidth:38}}>{playing?'⏸':'▶'}</button>
          <button onClick={()=>setTimeline(v=>Math.min(100,v+10))} style={{padding:'4px 7px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.35)',cursor:'pointer',borderRadius:2,fontSize:9,fontFamily:'JetBrains Mono'}}>+10</button>
          <button onClick={()=>{setTimeline(0);setPlaying(false);setObstacles([]);setEqRoutes([]);setRoutesReady(false);setEqAmbRoutes([])}} style={{padding:'4px 7px',background:'transparent',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.2)',cursor:'pointer',borderRadius:2,fontSize:9,fontFamily:'JetBrains Mono'}}>↺</button>
        </div>
        <div style={{flex:1,position:'relative',height:24,display:'flex',alignItems:'center'}}>
          <div style={{position:'absolute',top:'50%',left:0,right:0,height:3,background:'rgba(255,255,255,0.07)',borderRadius:1,transform:'translateY(-50%)'}}>
            <div style={{height:'100%',width:`${timeline}%`,background:'rgba(239,68,68,0.5)',borderRadius:1,transition:playing?'none':'width 0.1s'}}/>
          </div>
          {[{p:0,l:'Pre'},{p:5,l:'M-shock'},{p:15,l:'Active'},{p:45,l:'Aftershocks'},{p:75,l:'Stabilise'},{p:100,l:'T+24'}].map(m=>(
            <div key={m.p} style={{position:'absolute',left:`${m.p}%`,transform:'translateX(-50%)',top:0,textAlign:'center',pointerEvents:'none'}}>
              <div style={{width:1,height:6,background:'rgba(255,255,255,0.15)',margin:'0 auto'}}/>
              <div style={{fontSize:7,color:'rgba(255,255,255,0.2)',fontFamily:'JetBrains Mono',whiteSpace:'nowrap',marginTop:1}}>{m.l}</div>
            </div>
          ))}
          <input type="range" min={0} max={100} step={0.5} value={timeline} onChange={e=>setTimeline(parseFloat(e.target.value))} className="timeline-scrubber" style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:2,opacity:0,cursor:'pointer'}}/>
        </div>
        <span style={{fontSize:9,fontFamily:'JetBrains Mono',color:'rgba(255,255,255,0.2)',minWidth:50,textAlign:'right'}}>{Math.round(timeline)}%</span>
      </div>
    </div>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
const TAGLINES = [
  'Bridging Citizens to Safety — Real Time Disaster Response',
  'राष्ट्रीय आपदा प्रबंधन प्रणाली · National Disaster Management',
  'Live Flood Monitoring · Ernakulam District, Kerala',
  '22 Evacuation Routes · 94+ Hospitals · Emergency Dispatch Active',
  'सतर्कता ही सुरक्षा है — Vigilance is Safety',
  '⚠ Mullaperiyar Dam at 88% capacity — continuous monitoring active',
]

function LandingMapBg() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const map = L.map(ref.current, {
      center: CENTER, zoom: 12,
      zoomControl: false, dragging: false,
      scrollWheelZoom: false, touchZoom: false,
      doubleClickZoom: false, keyboard: false,
      attributionControl: false,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {maxZoom: 19}).addTo(map)
    return () => { map.remove() }
  }, [])
  return <div ref={ref} style={{width:'100%',height:'100%'}} />
}

function LandingPage({onGuest, onAdmin}: {onGuest:()=>void; onAdmin:()=>void}) {
  const [tagIdx, setTagIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setTagIdx(i => (i + 1) % TAGLINES.length); setVisible(true) }, 450)
    }, 4000)
    return () => clearInterval(iv)
  }, [])

  const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s)
  const devaFont = "'Noto Sans Devanagari', 'Inter', sans-serif"
  const latinFont = "'Inter', sans-serif"

  return (
    <div style={{position:'relative',width:'100%',height:'100%',overflow:'hidden',background:'#060D1F',fontFamily:latinFont}}>
      {/* Map background — lightly blurred, clearly visible */}
      <div style={{position:'absolute',inset:0,filter:'blur(2px) brightness(0.72)',transform:'scale(1.02)',zIndex:0,pointerEvents:'none'}}>
        <LandingMapBg />
      </div>

      {/* Gradient overlay — thin vignette only, preserves map readability */}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(160deg,rgba(6,13,31,0.45) 0%,rgba(4,9,20,0.18) 50%,rgba(6,13,31,0.5) 100%)',zIndex:1,pointerEvents:'none'}} />

      {/* Top tricolor stripe */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:5,zIndex:20,display:'flex'}}>
        <div style={{flex:1,background:'#FF9933'}} />
        <div style={{flex:1,background:'#F8F8F8'}} />
        <div style={{flex:1,background:'#138808'}} />
      </div>

      {/* Header bar */}
      <div style={{position:'absolute',top:5,left:0,right:0,height:62,zIndex:15,display:'flex',alignItems:'center',padding:'0 28px',background:'rgba(4,9,22,0.82)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,153,51,0.18)'}}>
        {/* Emblem + name */}
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:44,height:44,borderRadius:'50%',background:'rgba(255,153,51,0.1)',border:'1.5px solid rgba(255,153,51,0.45)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span className="chakra-spin" style={{fontSize:22,display:'block',lineHeight:1}}>☸</span>
          </div>
          <div>
            <div style={{fontSize:17,fontWeight:900,color:'#FFFFFF',letterSpacing:2,lineHeight:1.05,textTransform:'uppercase'}}>Suraksha Setu</div>
            <div style={{fontSize:10.5,color:'rgba(255,153,51,0.85)',fontFamily:devaFont,fontWeight:600,lineHeight:1.25}}>सुरक्षा सेतु · Emergency Operations</div>
          </div>
        </div>

        {/* Centre: ministry line */}
        <div style={{position:'absolute',left:'50%',transform:'translateX(-50%)',textAlign:'center',pointerEvents:'none'}}>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.32)',letterSpacing:1.8,fontWeight:500,textTransform:'uppercase'}}>Ministry of Home Affairs · Government of India</div>
          <div style={{fontSize:8,color:'rgba(255,153,51,0.35)',letterSpacing:0.8,marginTop:2,fontFamily:devaFont}}>गृह मंत्रालय · भारत सरकार</div>
        </div>

        {/* Admin portal button */}
        <div style={{marginLeft:'auto'}}>
          <button
            onClick={onAdmin}
            style={{padding:'9px 22px',background:'rgba(255,153,51,0.1)',border:'1.5px solid rgba(255,153,51,0.45)',color:'#FF9933',borderRadius:2,cursor:'pointer',fontSize:11,fontWeight:800,letterSpacing:1.5,display:'flex',alignItems:'center',gap:9,transition:'background 0.2s,border-color 0.2s,box-shadow 0.2s'}}
            onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='rgba(255,153,51,0.22)';b.style.borderColor='rgba(255,153,51,0.8)';b.style.boxShadow='0 0 20px rgba(255,153,51,0.2)'}}
            onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='rgba(255,153,51,0.1)';b.style.borderColor='rgba(255,153,51,0.45)';b.style.boxShadow='none'}}
          >
            <span style={{fontSize:14}}>🔐</span> ADMIN PORTAL
          </button>
        </div>
      </div>

      {/* Main center card */}
      <div style={{position:'absolute',inset:0,zIndex:10,display:'flex',alignItems:'center',justifyContent:'center',paddingTop:67,paddingBottom:40}}>
        <div style={{width:'min(560px,92vw)',background:'rgba(5,11,28,0.9)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,153,51,0.22)',borderRadius:3,padding:'40px 44px 36px',boxShadow:'0 40px 100px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,153,51,0.08)',textAlign:'center'}}>

          {/* Shield + chakra decoration */}
          <div style={{position:'relative',display:'inline-block',marginBottom:16}}>
            <div style={{fontSize:52,lineHeight:1,filter:'drop-shadow(0 0 24px rgba(255,153,51,0.45))'}}>🛡️</div>
          </div>

          {/* Main title */}
          <div style={{fontSize:40,fontWeight:900,color:'#FFFFFF',letterSpacing:4,lineHeight:1,marginBottom:6,textTransform:'uppercase'}}>Suraksha Setu</div>
          <div style={{fontSize:28,fontWeight:800,color:'#FF9933',fontFamily:devaFont,lineHeight:1.3,marginBottom:4}}>सुरक्षा सेतु</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',letterSpacing:2.5,fontWeight:600,textTransform:'uppercase',marginBottom:22}}>National Disaster Response Platform</div>

          {/* Divider with emblem */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
            <div style={{flex:1,height:1,background:'linear-gradient(to right,transparent,rgba(255,153,51,0.3))'}} />
            <div style={{fontSize:9,color:'rgba(255,153,51,0.5)',letterSpacing:1.5,fontWeight:700}}>सत्यमेव जयते</div>
            <div style={{flex:1,height:1,background:'linear-gradient(to left,transparent,rgba(255,153,51,0.3))'}} />
          </div>

          {/* Animated tagline */}
          <div style={{height:22,marginBottom:22,overflow:'hidden'}}>
            <div style={{transition:'opacity 0.45s,transform 0.45s',opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(8px)',fontFamily:isDevanagari(TAGLINES[tagIdx]) ? devaFont : latinFont,fontSize:12.5,color:'rgba(255,255,255,0.62)',letterSpacing:0.4,lineHeight:1.5}}>
              {TAGLINES[tagIdx]}
            </div>
          </div>

          {/* Live stats row */}
          <div style={{display:'flex',justifyContent:'center',gap:20,marginBottom:24}}>
            {[['94+','Hospitals'],['22','Evac Routes'],['6','EOC Units'],['15','Dam Monitors']].map(([v,l]) => (
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:800,color:'#FF9933',lineHeight:1}}>{v}</div>
                <div style={{fontSize:8.5,color:'rgba(255,255,255,0.35)',letterSpacing:0.8,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Alert badge */}
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:2,marginBottom:26}}>
            <div className="pulse-red" style={{width:7,height:7,borderRadius:'50%',background:'#ef4444',flexShrink:0}} />
            <span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.8)',letterSpacing:0.8}}>FLOOD WARNING ACTIVE</span>
            <span style={{width:1,height:12,background:'rgba(255,255,255,0.15)'}} />
            <span style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>Ernakulam District · Kerala</span>
          </div>

          {/* Enter as citizen button */}
          <button
            onClick={onGuest}
            style={{width:'100%',padding:'15px 20px',background:'linear-gradient(135deg,rgba(255,153,51,0.14) 0%,rgba(19,136,8,0.1) 100%)',border:'1.5px solid rgba(255,153,51,0.4)',color:'#FFFFFF',borderRadius:2,cursor:'pointer',fontSize:14,fontWeight:800,letterSpacing:2,display:'flex',alignItems:'center',justifyContent:'center',gap:14,transition:'all 0.25s',textTransform:'uppercase'}}
            onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='linear-gradient(135deg,rgba(255,153,51,0.26) 0%,rgba(19,136,8,0.18) 100%)';b.style.borderColor='rgba(255,153,51,0.75)';b.style.boxShadow='0 0 32px rgba(255,153,51,0.18)'}}
            onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='linear-gradient(135deg,rgba(255,153,51,0.14) 0%,rgba(19,136,8,0.1) 100%)';b.style.borderColor='rgba(255,153,51,0.4)';b.style.boxShadow='none'}}
          >
            <span style={{fontSize:20}}>🗺️</span>
            Enter as Citizen
            <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:400,letterSpacing:0.5,textTransform:'none'}}>→ Guest Mode</span>
          </button>

          <div style={{marginTop:14,fontSize:10,color:'rgba(255,255,255,0.2)',letterSpacing:0.3}}>
            No login required · Read-only access · Live disaster map
          </div>
        </div>
      </div>

      {/* Bottom ticker */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:38,zIndex:15,background:'rgba(4,9,22,0.94)',borderTop:'1px solid rgba(255,153,51,0.18)',display:'flex',alignItems:'center',overflow:'hidden'}}>
        <div style={{padding:'0 16px',background:'#FF9933',height:'100%',display:'flex',alignItems:'center',flexShrink:0,gap:6}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:'#060D1F',animation:'blink 1s step-end infinite'}} />
          <span style={{fontSize:10,fontWeight:900,color:'#060D1F',letterSpacing:1.5}}>LIVE</span>
        </div>
        <div style={{flex:1,overflow:'hidden',maskImage:'linear-gradient(to right,transparent 0,black 32px,black calc(100% - 32px),transparent 100%)'}}>
          <div className="marquee-track" style={{display:'inline-flex',gap:0,whiteSpace:'nowrap'}}>
            {[...Array(2)].map((_,ri) => [
              '🔴 FLOOD WARNING: Ernakulam District — 22 evacuation routes fully active',
              '🏥 94 hospitals on alert · 92 school shelters operational across district',
              '⚠ Mullaperiyar Dam 88% capacity — continuous level monitoring in effect',
              '🚑 EOC coordinating ambulance dispatch and patient transfer operations',
              '📡 Real-time OSRM routing · RainViewer radar · seismic network online',
              '🌧 IMD advisory: heavy rainfall forecast next 48 hours — stay alert',
              '🛡️ NDMA · NDRF · State EOC Kerala · IMD · Ministry of Home Affairs',
            ].map((t,i) => (
              <span key={`${ri}-${i}`} style={{fontSize:11,color:'rgba(255,255,255,0.6)',letterSpacing:0.3,padding:'0 6px'}}>
                {t}<span style={{margin:'0 22px',color:'rgba(255,153,51,0.35)'}}>◆</span>
              </span>
            )))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Login Modal ──────────────────────────────────────────────────────────────
function LoginModal({pw,onPwChange,onLogin,error,onClose}:{pw:string;onPwChange:(v:string)=>void;onLogin:()=>void;error:string;onClose:()=>void}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
      <div style={{background:'rgba(13,18,36,0.98)',border:'1px solid rgba(6,182,212,0.25)',borderRadius:5,padding:'28px 32px',width:300,boxShadow:'0 24px 60px rgba(0,0,0,0.6)'}}>
        <div style={{fontSize:9,fontFamily:'JetBrains Mono',color:'#FF9933',letterSpacing:2,marginBottom:4,fontWeight:700}}>SURAKSHA SETU · सुरक्षा सेतु</div>
        <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.9)',marginBottom:4}}>Admin Portal</div>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginBottom:20}}>EOC staff access only — authorised personnel</div>
        <div style={{fontSize:9,fontFamily:'JetBrains Mono',color:'rgba(255,255,255,0.4)',marginBottom:5,letterSpacing:0.5}}>PASSCODE</div>
        <input type="password" value={pw} onChange={e=>onPwChange(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onLogin()} placeholder="Enter passcode" style={{width:'100%',padding:'8px 10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(6,182,212,0.3)',borderRadius:3,color:'#e2e8f0',fontSize:12,fontFamily:'JetBrains Mono',outline:'none',boxSizing:'border-box',marginBottom:6}}/>
        {error&&<div style={{fontSize:9,color:'#ef4444',fontFamily:'JetBrains Mono',marginBottom:8}}>{error}</div>}
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <button onClick={onLogin} style={{flex:1,padding:'8px',background:'rgba(255,153,51,0.15)',border:'1px solid rgba(255,153,51,0.5)',color:'#FF9933',borderRadius:3,cursor:'pointer',fontSize:10,fontFamily:'JetBrains Mono',fontWeight:700,letterSpacing:1}}>LOGIN</button>
          <button onClick={onClose} style={{padding:'8px 12px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.35)',borderRadius:3,cursor:'pointer',fontSize:10,fontFamily:'JetBrains Mono'}}>CANCEL</button>
        </div>
      </div>
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view,setView]=useState<AppView>('landing')
  const [loginOpen,setLoginOpen]=useState(false)
  const [loginPw,setLoginPw]=useState('')
  const [loginError,setLoginError]=useState('')

  const handleLogin=()=>{
    if (loginPw.trim()==='123'){setView('admin');setLoginOpen(false);setLoginPw('');setLoginError('')}
    else setLoginError('Invalid passcode')
  }

  return (
    <>
      {view==='landing'&&<LandingPage onGuest={()=>setView('public')} onAdmin={()=>setLoginOpen(true)}/>}
      {view==='public'&&<PublicView onAdmin={()=>setLoginOpen(true)}/>}
      {view==='admin'&&<AdminView onLogout={()=>setView('landing')} onEarthquake={()=>setView('earthquake')}/>}
      {view==='earthquake'&&<EarthquakeView onBack={()=>setView('admin')}/>}
      {loginOpen&&<LoginModal pw={loginPw} onPwChange={setLoginPw} onLogin={handleLogin} error={loginError} onClose={()=>{setLoginOpen(false);setLoginPw('');setLoginError('')}}/>}
    </>
  )
}
