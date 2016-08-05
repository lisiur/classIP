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
      console.log("ajax");
      var self = this;
      $(self).attr("disabled", "disabled");
      var parameters = { weight: $("#weight").val() };
      $.post('/uploads/rejudge', parameters, function(data, status) {
        console.log(status);
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

        // 恢复不可用状态
        $(self).removeAttr("disabled");
      });
    });
  });
});
