import { writable } from 'svelte/store'
function storeData() {
    let maney = 0.0;
    const data = writable([]);
    const checkboxFlag = writable(false);
    const checkedList = writable([]);
    return {
        data:data,
        checkboxFlag:checkboxFlag,
        checkedList:checkedList,
        checkboxChange: function (event) {
            const flag = event.target.checked;
            checkboxFlag.set(flag);
            data.update(data => {
                $data.filter(item => {
                    item.checkFlag = flag;
                });
                return data
            });

            checkboxFlagClick();
        },
        inptClick:function (event) {
            const id = event.target.getAttribute("data-id") * 1;
            data.update(data => {
              data.filter(item => {
                if (item.id === id) {
                  item.checkFlag = event.target.checked;
                }
              });
              return data;
            });
            checkboxFlagClick();
        },
        checkboxFlagClick:function() {
            let trueList = $data.filter(item => {
              return item.checkFlag === true;
            });
            checkedList.set(trueList);
            maney = $checkedList.reduce((prev, curr) => {
              return prev + curr.count * curr.price;
            }, 0);
          }
    }
}
export default storeData()