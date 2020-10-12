

class Calendar {
  constructor() {
    this.timer = null
    this.nowYear = null
    this.nowMonth = null
    this.nowDate = null
    this.currentYear = null
    this.currentMonth = null
    this.lastState = null
    this.changeState = 0    // 0-date  1-month  2-year

    // 表盘
    this.clock = this.getElement('#clock')
    // 指针
    this.hourPointer = this.getElement(".pointer-hour");
    this.minutePointer = this.getElement(".pointer-minute");
    this.secondsPointer = this.getElement(".pointer-second");
    // 当前日期
    this.dateText = this.getElement('#date')
    this.weekdayText = this.getElement('#week')
    // 控制条
    this.dateCtrl = this.getElement('#dateCtrl')
    this.prevCtrl = this.getElement('#prevCtrl')
    this.nextCtrl = this.getElement('#nextCtrl') 
    // 日历
    this.calendarPanel = this.getElement('.calendar-wrapper')
    this.boardToHide = this.getElement('.out-board', this.calendarPanel)
    this.boardToShow = this.getElement('.in-board', this.calendarPanel)
  }

  getElement(selector, context) {
    return (context || document).querySelector(selector)
  }

  init() {
    this.initClock()    // 表盘
    this.initDateText() // 日期文字
    this.initCtrl()     // 工具条
    this.initCalendar() // 日历
  }

  /**================================================== 1. 表盘 ==================================================*/
  initClock() {
    this.createLattice()
    this.setPointer()
    this.refreshPointer()
  }
  // 表盘刻度
  createLattice() {
    let code = ''
    for (var i = 0; i < 12; i++) {
      code += '<li class="clock-lattice" style="transform: rotate(' + (360 / 12 * i) + 'deg)"></li>'
    }
    this.clock.innerHTML = code
  }
  // 表盘指针
  setPointer() {
    let now = new Date()
    let seconds = now.getSeconds()
    let minute = now.getMinutes() + seconds / 60
    let hour = now.getHours() + minute / 60
    let secondsDeg = 360 / 60 * seconds + 45     // 初始旋转角度45°
    let minuteDeg = 360 / 60 * minute
    let hourDeg = 360 / 12 * hour
    this.hourPointer.style.transform = "rotate(" + hourDeg + "deg)";
    this.minutePointer.style.transform = "rotate(" + minuteDeg + "deg)";
    this.secondsPointer.style.transform = "rotate(" + secondsDeg + "deg)";
  }
  // 刷新指针旋转角度
  refreshPointer() {
    if (this.timer) {
      clearInterval(this.timer)
    }
    this.timer = setInterval(() => {
      this.setPointer()
    }, 1000);
  }

  /**================================================== 2. 日期文字 ==================================================*/
  initDateText() {
    let now = new Date()
    this.nowYear = now.getFullYear()
    this.nowMonth = now.getMonth()
    this.nowDate = now.getDate()
    let dateText = this.nowYear + '年' + (this.nowMonth + 1) + '月' + this.nowDate + '日'
    let weekText = '星期' + '日一二三四五六'.charAt(now.getDay())
    this.dateText.innerHTML = dateText
    this.weekdayText.innerHTML = weekText
  }

  /**================================================== 3. 工具条 ==================================================*/
  initCtrl() {
    let now = new Date()
    this.currentYear = now.getFullYear()
    this.currentMonth = now.getMonth()
    this.setCtrlText()
    this.bindCtrlEvent()
  }

  // 工具条日期内容
  setCtrlText() {
    let text = ''
    switch (this.changeState) {
      case 0:
        text = this.currentYear + '年' + (this.currentMonth + 1) + '月'
        break;
      case 1:
        text = this.currentYear + '年'
        break;
      case 2:
        var rangeYear = this.calcYearRange()
        text = rangeYear.startYear + ' - ' + rangeYear.endYear
        break;
    }
    this.dateCtrl.innerHTML = text
  }

  // 绑定工具条事件
  bindCtrlEvent() {
    const that = this
    // 工具 - 日期切换：日期 / 月份 / 年份
    this.dateCtrl.addEventListener('click', function (e) {
      let targetState = that.changeState + 1 
      that.changeCtrlDate(targetState)
    })
    // 工具 - 上下箭头切换
    this.prevCtrl.addEventListener('click', function (e) {
      that.changeCtrlArrow('prev')
    })
    this.nextCtrl.addEventListener('click', function (e) {
      that.changeCtrlArrow('next')
    })
  }

  // 事件处理：切换工具条中的日期
  changeCtrlDate(changeState) {  
    this.lastState = this.changeState
    this.changeState = changeState
    if(this.changeState > 2){
      this.changeState = 2
    }
    this.setCtrlText()
    this.setCalendar() 
  }

  // 向上向下切换：根据当前的 changeState 会有不同的操作
  changeCtrlArrow(option) {
    let s = option === 'prev' ? -1 : 1
    switch (this.changeState) {
      case 0:
        // 当前就是日历视图：点击向上的按钮，切换到上一个月的日历; 向下按钮切换到下一月视图
        let targetMonth = this.currentMonth + (s * 1)
        if (targetMonth > 11) {
          this.currentMonth = 0
          this.currentYear = this.currentYear + 1
        }
        else if (targetMonth < 0) {
          this.currentMonth = 11
          this.currentYear = this.currentYear - 1
        }
        else {
          this.currentMonth = targetMonth
        }
        break;
      case 1:
        // 当前就是月视图：点击向上的按钮，年份减一; 向下按钮切换到下一月视图
        this.currentYear = this.currentYear + (s * 1)
        break;
      case 2:
        // 当前就是年视图：点击向上的按钮，年份减十; 向下按钮切换到下一月视图
        this.currentYear = this.currentYear + (s * 10)
        break;
    }
    this.lastState = this.changeState
    this.setCtrlText()
    this.setCalendar(option)
  }

  /**================================================== 4. 日历 ==================================================*/
  initCalendar() {
    this.setCalendar()
    this.bindCellEvent()
  }

  setCalendar(direction) {
    let op = this.lastState - this.changeState    // 大于0 - 年回退到月, 月回退到日  小于0 - 日切换到月, 月切换到年   等于0 - 当前状态间的切换 
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

  calcYearRange() {
    let year = this.currentYear
    var startYear = Math.floor(year / 10) * 10      // 2019 -- 201.9 -- 201 * 10 -- 2010
    var endYear = startYear + 9
    return {
      startYear: startYear,
      endYear: endYear
    }
  }

  // 年份视图：固定 16 个格子(4x4)：4个上年份 + 10个当前年份 + 2个下年份
  createYearView() {    
    let year = this.currentYear
    var rangeYear = this.calcYearRange()
    let startYear = rangeYear.startYear
    let endYear = rangeYear.endYear

    let calendarHtml = '<ul class="calendar-year">'
    for (var i = 0; i < 16; i++) {
      if (i < 4) {
        calendarHtml += '<li class="cell year-cell last-cell">' + (startYear - (4 - i)) + '</li>'
      }
      else if (i < 14) {
        let year = startYear + (i - 4)
        let activeClass = this.currentYear === year ? 'active' : ''
        calendarHtml += '<li class="cell year-cell curr-cell ' + activeClass + '">' + year + '</li>'
      }
      else {
        calendarHtml += '<li class="cell year-cell next-cell">' + (endYear + i - 14 + 1) + '</li>'
      }
    }

    calendarHtml += '</ul>'
    return calendarHtml;
  }

  // 月份视图：固定12个格子(4x3)
  createMonthView() {
    let year = this.currentYear 
    let month = this.currentMonth
    let calendarHtml = '<ul class="calendar-month">';
    for (var i = 1; i <= 12; i++) {
      let activeClass = ''
      if (year === this.nowYear && (month + 1) === i) {
        activeClass = 'active'
      }
      calendarHtml += '<li class="cell month-cell ' + activeClass + '">' + i + '月</li>'
    }
    calendarHtml += '</ul>'
    return calendarHtml;
  }

  // 日历视图：固定42个格子(7x6)：上个月剩余 + 本月 + 下个月开始
  createDateView() {
    let year = this.currentYear 
    let month = this.currentMonth
    // 周    
    let headerHtml = '<ul class="calendar-week">'
    for (var i = 0; i < 7; i++) {
      headerHtml += '<li class="week-cell">' + '日一二三四五六'.charAt(i) + '</li>'
    }
    headerHtml += '</ul>'

    // 日历 new Date(year, month, day) 根据指定的年月日创建一个日期对象 
    let lastEndDate = new Date(year, month, 0).getDate()  // 上个月(currentMonth)的最后一天是几号
    let startDay = new Date(year, month, 1).getDay()   // 获取当前月(currentMonth+1)的第一天是周几(前面就会空几格)
    let endDate = new Date(year, month + 1, 0).getDate()  // 获取当前月(currentMonth+1)的最后一天是几号  

    let calendarHtml = '<ul class="calendar-date">'
    for (var i = 0; i < 42; i++) {
      if (i < startDay) { // 当前月的开始一天是周几，前面就会空几格显示上个月的最后几天
        calendarHtml += '<li class="cell date-cell last-cell">' + (lastEndDate - (startDay - i)) + '</li>'
      }
      else if (i < endDate + startDay) {
        let activeClass = ''
        let date = (i - startDay + 1)
        if (year === this.nowYear && month === this.nowMonth && date === this.nowDate) {
          activeClass = 'active'
        }
        calendarHtml += '<li class="cell date-cell curr-cell ' + activeClass + '">' + date + '</li>'
      }
      else {
        calendarHtml += '<li class="cell date-cell next-cell">' + (i - endDate - startDay + 1) + '</li>'
      }
    }
    calendarHtml += '</ul>'
    return headerHtml + calendarHtml;
  }

  // 绑定日历格式视图
  bindCellEvent(){
    const that = this
    let unboundForEach = Array.prototype.forEach
    let forEach = Function.prototype.call.bind(unboundForEach)

    if(this.changeState === 0){
      var dateCell = this.calendarPanel.querySelectorAll('.date-cell')
      forEach(dateCell, function(cell){
        cell.addEventListener('click', function(e){ 
          // 移除已经选中的样式
          var checkedCell = that.calendarPanel.querySelectorAll('.date-cell.checked')
          if(checkedCell && checkedCell.length){
            forEach(checkedCell, function(c){
              c.classList.remove('checked') 
            }) 
          }
          // 添加选中样式
          e.target.classList.add('checked') 
        })
      })
    }
    if(this.changeState === 1){ 
      var monthCell = this.calendarPanel.querySelectorAll('.month-cell')
      forEach(monthCell, function(cell){
        cell.addEventListener('click', function(e){ 
          that.currentMonth = parseInt(e.target.innerHTML) - 1
          that.changeCtrlDate(0)
        })
      })
    }
    if(this.changeState === 2){
      var yearCell = this.calendarPanel.querySelectorAll('.year-cell')
      forEach(yearCell, function(cell){
        cell.addEventListener('click', function(e){ 
          that.currentYear = parseInt(e.target.innerHTML)
          that.changeCtrlDate(1)
        })
      })
    } 
  }
}

let calendar = new Calendar()
calendar.init()