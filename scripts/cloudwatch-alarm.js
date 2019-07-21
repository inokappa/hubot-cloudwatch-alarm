// Description:
//  CloudWatch Alarm のリスト, 通知の有効化, 無効化
//
// Dependencies:
//  - aws-sdk
//  - markdown-table
//
// Commands:
//  hubot cloudwatch alarm list - Alarm 一覧の取得
//  hubot cloudwatch alarm disable [Alarm Name] - Alarm 通知の無効化
//  hubot cloudwatch alarm enable [Alarm Name] - Alarm 通知の有効化

const AWS = require('aws-sdk')
const TABLE = require('markdown-table')

module.exports = (robot => {
  const cw = new AWS.CloudWatch({ region: 'ap-northeast-1' })

  robot.respond(/cloudwatch alarm disable (.*)/, async res => {
    const alarmName = res.match[1]
    const result = await disableAlarm(alarmName)
    console.log(result)
    res.send(result)
  })

  robot.respond(/cloudwatch alarm enable (.*)/, async res => {
    const alarmName = res.match[1]
    const result = await enableAlarm(alarmName)
    res.send(result)
  })

  robot.respond(/cloudwatch alarm list/, async res => {
    listAlarms().then(function (alarms){
      filename = 'alarmlist.txt'
		  opts = {
		  	content: genlistAlarms(alarms),
		  	title: 'Alarm List',
		  	channels: res.message.room
		  }
      // snipet で送信
		  robot.adapter.client.web.files.upload(filename, opts)
    })
  })

  const listAlarms = () => new Promise(
      (resolve, reject) => {
          const result = [['AlarmName', 'Status', 'ActionsEnabled']];
          const loop = (token) => {
              cw.describeAlarms({
                  NextToken: token
              }).promise()
              .then((data) => {
                  data.MetricAlarms.map((a) => {
                      if (! a.AlarmName.startsWith('Target')) {
                        result.push([
                            a.AlarmName,
                            a.StateValue,
                            a.ActionsEnabled
                        ]);
                      }
                  });
                  if (data.NextToken) {
                      loop(data.NextToken);
                  } else {
                      resolve(result);
                  }
              })
              .catch(reject);
          };
          loop();
      }
  );

  function genlistAlarms(alarms) {
      return TABLE(alarms)
  }

  const disableAlarm = async (alarmName) => {
    let message
    try {
      await cw.disableAlarmActions({ AlarmNames: [alarmName] }).promise()
      message = `OK, Alarm: \`${alarmName}\` notification is \`disabled\`.`
    } catch(e) {
      message = e
    }
    return message
  }

  const enableAlarm = async (alarmName) => {
    let message
    try {
      await cw.enableAlarmActions({ AlarmNames: [alarmName] }).promise()
      message = `OK, Alarm: \`${alarmName}\` notification is \`enabled\`.`
    } catch(e) {
      message = e
    }
    return message
  }
})
