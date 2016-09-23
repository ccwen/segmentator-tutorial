/* modified from   https://github.com/hermanschaaf/jieba-js */
var trie = {}, termfreq = {},min_freq = 0 ;//freq 是小於1對數，一定是負值
var buildDictTrie = function () {
    var i, ci, totalfreq = 0 /*總頻次*/;
    for (i = 0; i < Dict.length; i++) {
        const term = Dict[i][0],  freq = Dict[i][1];
        termfreq[term] = freq;
        totalfreq += freq;
        p = trie;
        for (ci = 0; ci < term.length; ci++) {
            const c = term[ci];
            if (!p[c]) p[c] = {};
            p = p[c];
        }
        p[''] = '!'; // ending flag
    }
    return totalfreq;
}
const initialize=function(){ //建立詞庫樹 及詞頻，並轉成對數，後面可用加法代替乘法
    const totalfreq= buildDictTrie();
    for (k in termfreq) {
        var v = termfreq[k];
        termfreq[k] = Math.log(v / totalfreq);
        if (termfreq[k] < min_freq) {
            min_freq = termfreq[k];
        }
    }
}; initialize(); //定義後直接執行
var sentanceDAG = function(sentence) { // 產生句子的 DAG 
    var N = sentence.length, DAG = {},
        i = 0, j = 0, p = trie;
    while (i < N) {
        const c = sentence[j];
        if (p[c]) {
            p = p[c];
            if (p['']=="!"){
                if (!(DAG[i])) DAG[i] = [];
                DAG[i].push(j);
            }
            j += 1;
            if (j >= N) { //終點超過字串，不會再構成詞
                i += 1;
                j = i;
                p = trie;
            }
        } else { //構不成詞，試字串的下一個字。
            p = trie; //移回樹頂點
            i += 1;
            j = i;
        }
    }    
    for (i = 0; i < sentence.length; i++) { //對於不存在於字典的每個字視為單字詞
        if (!DAG[i]) DAG[i] = [i]; //連回自己
    }
    return DAG;
}
var bestRoute = function( sentence, DAG ) { //找尋DAG最短路徑
    var N = sentence.length; //句子長度
    var route=[],//每一個節點的最佳路徑
        idx=0, //目前的出發節點
        bestProb,//從idx出發的最佳概率
        bestEnd; //最大機率到達的終點
    route[N] = [0.0,N]; //終止元素，否則 route[sentence.length] 會出錯
    for (idx = N - 1; idx > -1; idx--) { //從後面開始算起，因為中文句子一般權重往後的較大
        bestProb=-Infinity;   //重設為最小值(保證第一次bestProb一定會被設置)
        for (xi in DAG[idx]) { //對所有從idx出發的可能路徑
            var end = DAG[idx][xi]; //
            var w=sentence.substring(idx, end+1) ; //此路徑經過的的字，也就是詞
            var wfreq = termfreq[w] || min_freq ;  //查詞頻，無此詞則視為最小機率
            var candidateProb=wfreq + route[end+1][0];//候選概率，概率相乘。(已轉成對數，用加法)
            if (candidateProb>bestProb){ //是否有較佳概率？
                bestProb=candidateProb;  //設為最佳概率
                bestEnd=end;
            }
        }
        route[idx] = [bestProb, bestEnd]; //從idx出發的最佳概率及終端
    }
    return route;
}
var segSentence = function (sentence) {
    var out = [] ,i=0;
    const DAG = sentanceDAG(sentence);
    const route = bestRoute(sentence, DAG);
    console.log(route)
    while ( i<route.length){
        var s=sentence.substring(i,route[i][1]+1);
        if (s) out.push(s);
        i=route[i][1]+1;
    }
    return out;
}
var segmentText = function(text){
    var segment_all = false, yieldValues = [];
    var res=[],i;
    //加括號表示要保留splitter
    const sents=text.split(/([。，！？；：「」]+)/); //句子
    for (i=0;i<sents.length;i++) {
        r=segSentence(sents[i]);
        console.log(r)
        res=res.concat(r);
    }
    
    return res;
}
if (typeof module!=="undefined") module.exports=segmentText;else window.segmentText=segmentText;