<script>
  import { getContext, onMount } from "svelte";
  import { writable } from "svelte/store";
  import List from "./views/list.svelte";

  let maney = 0.0;

  const res = getContext("listStore");

  const data = writable([]);
  const checkboxFlag = writable(false);
  const checkedList = writable([]);
  

  onMount(async function() {
    const list = await fetch("http://localhost:3000/getList");
    const listData = await list.json();
    data.set(listData);
  });
  function checkboxChange(event) {
    const flag = event.target.checked;
    checkboxFlag.set(flag);
    data.update(data => {
      $data.filter(item => {
        item.checkFlag = flag;
      });
      return data
    });

    checkboxFlagClick();
  }
  function inptClick(event) {
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
  }
  function checkboxFlagClick() {
    let trueList = $data.filter(item => {
      return item.checkFlag === true;
    });
    checkedList.set(trueList);
    maney = $checkedList.reduce((prev, curr) => {
      return prev + curr.count * curr.price;
    }, 0);
  }
  function countClick(event){
    const type=event.target.getAttribute('type')
    const dataId=event.target.getAttribute("data-id") * 1
    type==="remove"?
    data.update(data => {
      data.filter(item => {
        if (item.id === dataId) {
          item.count>0?item.count--:item.count=0
        }
      });
      return data;
    })
    :data.update(data => {
      data.filter(item => {
        if (item.id === dataId) {
          item.count++
        }
      });
      return data;
    })
      checkboxFlagClick();
  }
  function removeClick(event){
    const removeId=event.target.getAttribute("remove-id")*1;
    let ind
    for(var i=0;i<$data.length;i++){
      if($data[i].id===removeId){
        ind=i
      }
    }
    data.update((data)=>{
      data.splice(ind,1)
      return data
    })
    checkboxFlagClick();
  }
</script>

<style>
  * {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .wrap {
    width: 100%;
    height: auto;
  }
  .content {
    width: 990px;
    margin: 0 auto;
  }
  .header {
    width: 100%;
    height: 30px;
    line-height: 30px;
    background: #e3e4e5;
    border-bottom: solid 1px #ddd;
  }
  .logo_search {
    width: 100%;
    height: 100px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .logo {
    height: 100%;
    display: flex;
    align-items: center;
  }
  .logo img {
    width: 134px;
    height: 42px;
  }
  .logo h1 {
    font-family: "楷体";
    margin: 20px 0 0 10px;
  }
  .logo_search .search {
    width: 325px;
    height: 24px;
    border: 2px solid #c91623;
    display: flex;
  }
  .logo_search .search input {
    border: 0;
    height: 24px;
    width: 255px;
    outline: 0;
    font-size: 13px;
    padding-left: 5px;
  }
  .logo_search .search button {
    flex: 1;
    height: 24px;
    border: 0;
    background: #c91623;
    text-align: center;
    color: #fff;
    font-weight: 700;
    font-size: 14px;
  }
  .list_head h3 {
    font-size: 14px;
    color: #e2231a;
  }
  .list_title {
    width: 100%;
    height: 43px;
    display: flex;
    align-items: center;
    background: #f3f3f3;
    border: 1px solid #e9e9e9;
    border-top: 0;
    box-sizing: border-box;
  }
  #list_box {
    width: 100%;
    height: 118px;
    display: flex;
    align-items: center;
    border-top: 1px solid #c5c5c5;
  }
  .active{
    background:#fff4e8;
  }
  .tr1 {
    width: 122px;
    padding-left: 11px;
    color: #666;
    font-size: 12px;
  }
  .tr2 {
    width: 208px;
    color: #666;
    font-size: 12px;
  }
  .trk {
    width: 170px;
    padding: 0 10px 0 20px;
  }
  .tr3 {
    width: 120px;
    color: #666;
    font-size: 12px;
    padding-right: 40px;
    text-align: right;
  }
  .tr4 {
    width: 80px;
    color: #666;
    font-size: 12px;
    text-align: center;
  }
  .tr5 {
    width: 100px;
    color: #666;
    font-size: 12px;
    padding-right: 40px;
    text-align: right;
  }
  .tr6 {
    width: 75px;
    color: #666;
    font-size: 12px;
  }
  .shop_buy {
    width: 100%;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid #f0f0f0;
    box-sizing: border-box;
    padding-left: 10px;
    margin-top: 20px;
  }
  .buy_btn {
    width: 100%;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  .checkbox {
    text-align: center;
    width: 55px;
  }
  .buy_btn p {
    font-size: 10px;
    margin-right: 10px;
  }
  .buy_btn button {
    width: 94px;
    height: 52px;
    background: url(http://misc.360buyimg.com/user/cart/css/i/cart-submit-btn-2018.png)
      0 0 no-repeat;
    border: 0;
  }
  .num {
    color: #e2231a;
  }
  .totalled {
    color: #e2231a;
    font-size: 18px;
    font-weight: bold;
  }
</style>

<div class="wrap">
  <header class="header" />
  <div class="content">
    <div class="logo_search">
      <div class="logo">
        <img
          src="http://misc.360buyimg.com/jdf/1.0.0/unit/global-header/5.0.0/i/jdlogo-201708-@1x.png"
          alt="" />
        <h1>购物车</h1>
      </div>

      <div class="search">
        <input type="text" placeholder="自营" />
        <button>搜索</button>
      </div>
    </div>
    <div class="list_head">
      <h3>
        全部商品
        <span>{$data.length}</span>
      </h3>
      <div class="list_title">
        <div class="tr1">
          <div>
            <input
              type="checkbox"
              on:click={event => checkboxChange(event)}
              checked={$checkboxFlag} />
            全选
          </div>
        </div>
        <div class="tr2">商品</div>
        <div class="trk" />
        <div class="tr3">单价</div>
        <div class="tr4">数量</div>
        <div class="tr5">小计</div>
        <div class="tr6">操作</div>
      </div>
      <div class="list_content">
        {#if $data.length > 0}
          {#each $data as item}
            <div class={item.checkFlag?'active':null} id="list_box">
              <div class="checkbox">
                <input
                  type="checkbox"
                  data-id={item.id}
                  checked={item.checkFlag}
                  on:click={event => inptClick(event)} />
              </div>
              <List list={item} {countClick} {removeClick}/>
            </div>
          {/each}
        {/if}
      </div>
      <div class="shop_buy">
        <div class="checkbox">
          <input
            type="checkbox"
            on:click={event => checkboxChange(event)}
            checked={$checkboxFlag} />
          全选
        </div>
        <div class="buy_btn">
          <p>
            已选择
            <span class="num">{$checkedList.length}</span>
            件商品
          </p>
          <p>
            总价:
            <span class="totalled">￥{maney}</span>
          </p>
          <button />

        </div>

      </div>
    </div>

  </div>

</div>
