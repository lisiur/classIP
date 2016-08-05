$("document").ready(function() {
  // 填充ip二进制为八位
  function tcip(str) {
    var b_ip_2 = str;
    var b_ip_2_len = b_ip_2.length;
    for(var iii=0 ; iii<8-b_ip_2_len; iii++){
      b_ip_2 = '0' + b_ip_2 ;
    }
    return b_ip_2;
  }

  function timeCount(timeCount_dom, timeCount_time) {
    $(timeCount_dom).attr("disabled", "disabled");
    var timeCount_text = $(timeCount_dom).text();
    (function inner(){
      if($(timeCount_dom).attr("error") !== "error") {
        if(timeCount_time === 0) {
          $(timeCount_dom).text(timeCount_text);
          $(timeCount_dom).removeAttr("disabled");
          return;
        }
        $(timeCount_dom).text(timeCount_time + '秒');
        timeCount_time = timeCount_time - 1;
        setTimeout(function(){
          inner();
        }, 1000);
      } else {
        $(timeCount_dom).removeAttr("error");
        return;
      }
    })();
  }
  // 添加监听事件
  $('span.ip').each(function() {
    var ip = $(this).text().split('/')[0];
    var ip_b = ip.split('.')[1];
    var ip_b_2 = parseInt(ip_b).toString(2);
    ip_b_2 = (function(str) {
      var b_ip_2 = str;
      var b_ip_2_len = b_ip_2.length;
      for(var iii=0 ; iii<8-b_ip_2_len; iii++){
        b_ip_2 = '0' + b_ip_2 ;
      }
      return b_ip_2;
    })(ip_b_2);
    $(this).after("<div class='ip-hint'>"+ ip_b_2 +"</div>");
    $(this).parent().children('.ip-hint').hide();
    var self = this;
    $(self).click(function () {
      $(self).parent().children('.ip-hint').toggle(200);
    });
  });

  // AJAX
  $(function() {
    $('#rejudge').on("click", function(e) {
      var self = this;
      timeCount_text = $(self).text();
      timeCount($(self)[0], 3);
      var parameters = { weight: $("#weight").val() };
      $.ajax({
        type: 'POST',
        url: '/uploads/rejudge',
        data: parameters,
        success: function(data) {
          $('.body').html(data.html);
          $('.tj span').html(data.tongji.now +'/' + data.tongji.original);
          // 添加监听事件
          $('span.ip').each(function() {
            var ip = $(this).text().split('/')[0];
            var ip_b = ip.split('.')[1];
            var ip_b_2 = parseInt(ip_b).toString(2);
            ip_b_2 = (function(str) {
              var b_ip_2 = str;
              var b_ip_2_len = b_ip_2.length;
              for(var iii=0 ; iii<8-b_ip_2_len; iii++){
                b_ip_2 = '0' + b_ip_2 ;
              }
              return b_ip_2;
            })(ip_b_2);
            $(this).after("<div class='ip-hint'>"+ ip_b_2 +"</div>");
            $(this).parent().children('.ip-hint').hide();
            var self = this;
            $(self).click(function () {
              $(self).parent().children('.ip-hint').toggle(200);
            });
          });
        },
        error: function(){
          $(self).attr("error", "error")
          $(self).attr("disabled", "disabled");
          $(self).text('请刷新页面');
        }
      });
    });
  });
});
