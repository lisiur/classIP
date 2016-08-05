var express = require('express');
var router = express.Router();
var fs = require("fs");
var session = require('express-session');
var multer = require("multer");
var XLSX = require('xlsx');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    var filename_arr = file.originalname.split('.');
    var time = new Date();
    var year = time.getFullYear();
    var mouth = time.getMonth()+1;
    mouth = mouth < 10 ? '0'+mouth : mouth;
    var day = time.getDay();
    day = day < 10 ? '0'+day : day;
    cb(null, 'ip' + '-' + year+mouth+day + '.' + filename_arr[filename_arr.length-1]);
  }
});
var upload = multer({storage: storage});

var analsys = function(all_data, zoom) {
  if (isNaN(zoom)) {
    zoom = 1;
  }
  function IP(ip, type) {
    var ips = ip.split('.');
    var tmp = [];
    for(var i in ips) {
      if(ips[i].toString().trim()){
        tmp.push(ips[i].toString());
      }
    }
    var ip_num = tmp.length;
    if(ip_num == 1 || type==1){
      if(type !==1 ) {
        tmp.push('0','0','0');
      }
      this.ip = tmp.join('.');
      this.mask = 8;
      this.subip = [];
    }
    if(ip_num == 2 || type==2){
      if(type !==2 ) {
        tmp.push('0','0');
      }
      this.ip = tmp.join('.');
      this.mask = 16;
    }
  }
  var get2 = function(ip){
    var str2 = parseInt(ip.split('.')[1]).toString(2);
    var cha = 8-str2.length;
    for(var i=0;i<cha;i++){
      str2 = '0'+str2;
    }
    return str2;
  };

  // 填充ip
  function tcip(str) {
    var b_ip_2 = str;
    var b_ip_2_len = b_ip_2.length;
    for(var iii=0 ; iii<8-b_ip_2_len; iii++){
      b_ip_2 = b_ip_2 + '0';
    }
    return b_ip_2;
  }

  var classed_IP = {}; //classed_IP保存汇聚完毕的ip地址
  //创建IP对象，并依据其A类地址进行分类，保存在a_ips中
  var a_ips = []; //A类IP
  for(var o in all_data) {
    var ip = all_data[o].B_IP.toString();
    if(ip){
      ip = new IP(ip);
      var ipa = ip.ip.split('.')[0];
      if(!(ipa in a_ips)){
        var ip_a = ip.ip.split('.');
        ip_a.splice(1,1);
        ip_a.push('0');
        ip_a = ip_a.join('.');
        a_ips[ipa] = new IP(ip_a,1);
        a_ips[ipa].subip.push(ip);
      }else{
        a_ips[ipa].subip.push(ip);
      }
    }
  }

  for(var a_ip in a_ips) { //对每组同类ip地址处理
    if(a_ips[a_ip] !== null) {
      var aip = a_ips[a_ip];
      var ip_b = [];
      var ip_value = []; //二进制形式保存每组B类IP
      var subip = a_ips[a_ip].subip;
      // console.log(subip);
      for(var b_ip in subip) {
        var str2 = get2(subip[b_ip].ip);
        for(var i = 1;i<=8;i++){
          if(str2.substr(0,i) in ip_value) {
            var obj = ip_value[str2.substr(0,i)];
            obj.num++;
            obj.value = obj.num/subip.length*1500*zoom+Math.log(obj.mask-8)/Math.log(2)*280;
          }else{
            ip_value[str2.substr(0,i)] = {
              ip: str2.substr(0,i),
              ip10: aip.ip.split('.')[0] + '.' + parseInt(tcip(str2.substr(0,i)),2).toString() + '.0.0',
              num: 1,
              mask: i+8,
              value: 1/subip.length*1500*zoom+Math.log(i)/Math.log(2)*280
            };
          }
        }
      }

      //去除无效值（分组少，掩码小）
      for(b_ip in subip) { //对所有ip遍历
        var str = get2(subip[b_ip].ip);//获取其二进制表示
        for(var j = 1;j<=8;j++){
          for(var k = j+1; k<=8 ;k++){
            if(ip_value[str.substr(0,k)]!== null && ip_value[str.substr(0,j)] !==  null && ip_value[str.substr(0,j)].num==ip_value[str.substr(0,k)].num){
              ip_value[str.substr(0,j)] = null;
              break;
            }
          }
        }
      }
      // if(aip.ip=='113.0.0.0'){
      //   for(var ss in ip_value) {
      //     if(ip_value[ss] !== null){
      //       console.log(ip_value[ss]);
      //     }
      //   }
      // }
      while(true) {
        var flag = true;
        var max_value_ip = null;
        var tps;
        // 寻找value最大的B类IP作为汇聚的IP
        for(var s in ip_value) {
          if(ip_value[s] !== null){
            // console.log(ip_value[s]);
            if(max_value_ip === null){
              tps = s;
              max_value_ip = ip_value[s];
              flag = false;
            }else{
              if(max_value_ip.value<ip_value[s].value){
                max_value_ip = ip_value[s];
                tps = s;
                flag = false;
              }
            }
          }
        }
        // if(aip.ip=='113.0.0.0'){
        //   console.log("寻找到最大valueip为");
        //   console.log(max_value_ip);
        // }
        if(flag) break;// 所有IP都汇聚完毕
        // 为已汇聚的B类IP填充其包含的子IP
        max_value_ip.subip = [];
        // 去除max_value_ip.ip所在节点的子节点
        for(s in ip_value) {
          if(ip_value[s] !== null && ip_value[s].ip.search(max_value_ip.ip) === 0){
            // 将叶子节点作为子IP存在subip中
            if(ip_value[s].mask===16){
              max_value_ip.subip.push(ip_value[s]);
            }
            ip_value[s] = null;
          }
        }
        // 去除max_value_ip.ip所在节点的父节点
        for(var pre=1; pre<= max_value_ip.ip.length; pre++) {
          var curip = max_value_ip.ip.substr(0,pre);
          // if(aip.ip=='113.0.0.0'){
          //   console.log("curip");
          //   console.log(curip);
          // }

          for(s in ip_value){
            if(ip_value[s] !== null && ip_value[s].ip === curip){
              ip_value[s] = null;
            }
          }
        }

        // if(aip.ip=='113.0.0.0'){
        //   console.log("剪枝后：");
        //   for(var ss in ip_value) {
        //     if(ip_value[ss] !== null){
        //       console.log(ip_value[ss]);
        //     }
        //   }
        // }


        ip_value[tps] = null;
        // console.log(aip);

        if(aip.ip in classed_IP) {
          classed_IP[aip.ip].push(max_value_ip);
        }else{
          classed_IP[aip.ip] = [max_value_ip];
        }
      }
      // console.log(classed_IP);

    }// end while
  }
  return classed_IP;
};

router.post('/download', function(req, res, next) {
  res.download(process.cwd() + '/' + req.session.filepath);
});
router.post('/rejudge', function(req, res) {
  console.log(req.body);
  var zoom = parseFloat(req.body.weight);

  var workbook = XLSX.readFile(req.session.filepath.split('.')[0]+'.xlsx');
  var first_sheet_name = workbook.SheetNames[0];
  var worksheet = workbook.Sheets[first_sheet_name];
  var all_data = XLSX.utils.sheet_to_json(worksheet);

  var classed_IP = analsys(all_data, zoom);
  var tongji = {
    original: all_data.length,
  };
  var tj = 0;
  for (var ipp in classed_IP){
    tj += classed_IP[ipp].length;
  }
  tongji.now = tj;
  var write_data = '';
  for(var w in classed_IP) {
    for(var y in classed_IP[w]) {
      write_data = write_data + classed_IP[w][y].ip10 + '/' + classed_IP[w][y].mask + '\n';
    }
  }

  fs.writeFile(req.session.filepath, write_data, function (err) {
    if(err) {
      console.error(err);
    }
    // console.log("写入文件成功！");
  });

  var html = '<div class="level1">';

  for(var aaip in classed_IP) {
    html = html + '<div class="item">'
                +     '<span class="ip">'
                +         aaip
                +     '</sapn>'
                +     '<div class="level2">';
    for(var bip in classed_IP[aaip]) {
      html = html +       '<div class="item">'
                  +          '<span class="ip">'
                  +              classed_IP[aaip][bip].ip10 + '/' + classed_IP[aaip][bip].mask
                  +          '</span>';
      for(var iip in classed_IP[aaip][bip].subip) {
        html = html +        '<div class="level3">'
                    +            '<div class="item">'
                    +                '<span class="ip">'
                    +                     classed_IP[aaip][bip].subip[iip].ip10 + '/' + classed_IP[aaip][bip].subip[iip].mask
                    +                '</span>'
                    +            '</div>'
                    +         '</div>';
      }
      html = html + '</div>';
    }
    html = html + '</div></div>';
  }
  html = html + '</div>';
  res.send({html: html, tongji: tongji});
});
router.post('/upload_file', upload.single('file'), function(req, res, next) {
  var zoom = parseFloat(req.body.zoom);
  var workbook = XLSX.readFile(req.file.path);
  var first_sheet_name = workbook.SheetNames[0];
  var worksheet = workbook.Sheets[first_sheet_name];
  var all_data = XLSX.utils.sheet_to_json(worksheet);

  var classed_IP = analsys(all_data, zoom);

  // 获取统计数据
  var tongji = {
    original: all_data.length,
  };
  var tj = 0;
  for (var ipp in classed_IP){
    tj += classed_IP[ipp].length;
  }
  tongji.now = tj;

  // 将已经汇聚的ip写入txt
  var write_data = '';
  for(var w in classed_IP) {
    for(var y in classed_IP[w]) {
      write_data = write_data + classed_IP[w][y].ip10 + '/' + classed_IP[w][y].mask + '\n';
    }
  }
  req.session.filepath = req.file.path.split('.')[0]+'.txt';
  fs.writeFile(req.session.filepath, write_data, function (err) {
    if(err) {
      console.error(err);
    }
    // console.log("写入文件成功！");
  });


  res.render('result',{classed_IP: classed_IP, tj: tongji, title: '分析成功'});

});

module.exports = router;
