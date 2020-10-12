# 开课吧 - win7日历

### 布局分析

1. 时钟 + 当前时间

    1. 时钟部分：主要通过 `tranform: rotate()` 来实现布局；并且每秒调用一次定时器来刷新指针的旋转角度

2. 控制栏：时间选择，时间切换

    1. 日历面板切换时：需要注意月份, 如果12月接着往下，那就应该自动切换到下一年的1月；如果1月接着往上，那就应该自动切换到上一年的12月
    2. 月视图面板切换时：需要注意切换的改变目标是 年份，也就是切换时年份会加1或者减1
    3. 年视图面板切换时：需要注意切换的基数是10，一次性切换的话需要加10或者减10

3. 日历主体部分：根据当前选中的时间类型，显示 年视图、月视图、日历视图

    1. 年视图：一共显示 16 格, 前4格显示上一个十年的末尾4个年份, 中间14格显示本十年度的年份，最后2格显示下十年的开始2个年份
        - 范围的获取：2019 => 201.9 => 取整乘10，得到2010，所以开始年份就是2010，再加9就获得结束年份 2019，计算式 `Math.floor(year / 10) * 10`
    2. 月视图：一共显示 12 格
    3. 日历视图： 一共显示42格
        - 通过 `new Date(year, monthIndex [, day])` 来获取指定的日期
          ```js
          new Date(2020, 9, 1)   // 获取2020年10月份的第一天，即 2020.10.01
          new Date(2020, 9, 0)   // 获取2020年9月份的最后一天，即 2020.09.30
          ```
        - 本月第一天是周几前面就会空几格，这些空的格子显示的就是上个月的末尾几天
        - 本月天数可能是：28，29，30，31
        - 最后一部分若格子数未达到 42 格，则接着显示下个月的开始几天

### 动画分析

1. 定义两个内容面板，一个用来存放即将隐藏的内容，一个用来存放即将显示的内容
  ```html
  <div class="calendar-wrapper">
    <div class="board out-board"></div>
    <div class="board in-board"></div>
  </div>
  ```

2. 定义一个 lastState 来记录上一个面板是什么视图，由此来判断视图切换时需要用的动画
3. 在同一视图中切换时，记录切换方向，并根据该方向来判断需要用的动画
4. 即将隐藏的内容就是上一次显示的内容，所以直接获取过来填充即可（避免还要根据不同的判断重新生成）
5. 动画结束后将动画样式去除，避免下次动画不生效
6. 内容生成后需要重新绑定样式
```js
setCalendar(direction) {
  // 大于0 - 年回退到月, 月回退到日  
  // 小于0 - 日切换到月, 月切换到年   
  // 等于0 - 当前状态间的切换; 此时需要根据传入的切换方向 direction 来判断动画名称
  let op = this.lastState - this.changeState    
  let outClass = op > 0 ? 'toBlow' : op < 0 ? 'toHide' : direction === 'prev' ? 'topOut' : direction === 'next' ? 'bottomOut': ''
  let inClass = op > 0 ? 'toNarrow': op < 0 ? 'toShow' : direction === 'prev' ? 'toTop' : direction === 'next' ? 'toBottom' : ''

  let currentHtml = this.boardToShow.innerHTML
  let nextHtml = ''
  switch (this.changeState) {
    case 0:   
      nextHtml += this.createDateView()
      break;
    case 1: 
      nextHtml += this.createMonthView()
      break;
    case 2:
      nextHtml += this.createYearView()
      break;
  }  
  // 添加样式 
  outClass && this.boardToHide.classList.add(outClass) 
  inClass && this.boardToShow.classList.add(inClass) 
  this.boardToHide.innerHTML = currentHtml
  this.boardToShow.innerHTML = nextHtml

  setTimeout(() => {
    outClass && this.boardToHide.classList.remove(outClass) 
    inClass && this.boardToShow.classList.remove(inClass)  
  }, 300);

  this.bindCellEvent()
}
```



### Date对象

Date 对象用于处理日期与时间。通过 `new Date()` 来创建 Date 对象

以下四种方法同样可以创建 Date 对象：

```js
new Date();
new Date(milliseconds);
new Date(dateString);
new Date(year, monthIndex [, day [, hours [, minutes [, seconds [, milliseconds]]]]]);  // 省略部分默认为 0
```

#### 一些常用方法
|方法|说明|
|--|--|
| getFullYear() | 【年】从 Date 对象以四位数字返回年份|
| getMonth() | 【月】从 Date 对象返回月份 (0 ~ 11)|
| getDate() | 【日】从 Date 对象返回一个月中的某一天 (1 ~ 31)|
| getDay() | 【周】从 Date 对象返回一周中的某一天 (0 ~ 6)|
| getHours() | 【时】返回 Date 对象的小时 (0 ~ 23)|
| getMinutes() | 【分】返回 Date 对象的分钟 (0 ~ 59)|
| getSeconds() | 【秒】返回 Date 对象的秒数 (0 ~ 59)|


#### 附：如何把日期格式化为指定格式？

```js
Date.prototype.format = function(fmt){
  var o = {
    "M+" : this.getMonth()+1,                 //月份
    "d+" : this.getDate(),                    //日
    "h+" : this.getHours(),                   //小时
    "m+" : this.getMinutes(),                 //分
    "s+" : this.getSeconds(),                 //秒
    "q+" : Math.floor((this.getMonth()+3)/3), //季度
    "S"  : this.getMilliseconds()             //毫秒
  };

  if(/(y+)/.test(fmt)){
    fmt = fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  }
        
  for(var k in o){
    if(new RegExp("("+ k +")").test(fmt)){
      fmt = fmt.replace(
        RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));  
    }       
  }

  return fmt;
}
```

使用：

```js 

document.getElementById("demo1").innerHTML=new Date(79,5,24,11,33,0).format("MM月dd日"); 

var now = new Date();
var nowStr = now.format("yyyy-MM-dd hh:mm:ss");
document.getElementById("demo2").innerHTML=new Date().format("yyyy年MM月dd日");
var nowStr = now.format("yyyy-MM-dd hh:mm:ss");
document.getElementById("demo3").innerHTML=new Date().format("yyyy年MM月dd日hh小时mm分ss秒");

```



