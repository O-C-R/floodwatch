import React, {Component} from 'react';
import $ from 'jquery';

export class CustomFilter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: false,
      curSettings: {
        name: this.props.filter.name,
        options: null
      },
      logic: 'OR'
    }
  }

  // toggleOpened() {
  //   let newState = !this.state.opened;
  //   this.setState({
  //     opened: newState
  //   })
  // }

  // updateSearchLogic(event) {
  //   this.setState({
  //     logic: event.target.value
  //   })
  // }

  render() {
    let elems = []

    this.props.filter.options.map((opt) => {
      const obj = {
        'name': this.props.filter.name,
        'choices': opt,
        'logic': this.state.logic
      }
      

        let checked = false;
        if (this.props.mySelection) {
          if ($.inArray(opt, this.props.mySelection.choices) > -1) {
            checked = true;
          }
        }



      elems.push(<div className="custom-option" /*style={{backgroundColor: backgroundColor}}*/><label><input checked={checked} onChange={this.props.handleFilterClick.bind(this, event, obj)} name={this.props.filter.name} type="checkbox"/>{opt}</label></div>)
      // elems.push(<div className="custom-option">{opt}</div>)
    }) 

    // let elems = [];
    // // first, check if this filter is enabled
    // if (this.props.shouldBeDisabled[0].disabled) {
    //   var myOverlay = <RequireOverlay requirements={this.props.shouldBeDisabled}/>

    //   elems.push(
    //     <OverlayTrigger rootClose={true} trigger="click" placement="right" overlay={myOverlay}>
    //       <p className="unlock-description">Unlock by adding your info</p>
    //     </OverlayTrigger>
    //     )
    // } else {
    //   for (let i = 0; i < this.props.filter.options.length; i++) {
    //     var obj = {
    //       'name': this.props.filter.name,
    //       'choices': this.props.filter.options[i],
    //       'logic': this.state.logic
    //     }

    //     var checked = false;
        
    //     // see if we've selected anything already
    //     if (this.props.mySelection) {
    //       if ($.inArray(this.props.filter.options[i], this.props.mySelection.choices) > -1) {
    //         checked = true;
    //       }
    //     }

    //     let backgroundColor = 'transparent';
    //     if (checked) {
    //       backgroundColor = 'lightyellow'
    //     }

    //     elems.push(<div className="custom-option" style={{backgroundColor: backgroundColor}}><label><input checked={checked} onChange={this.props.handleFilterClick.bind(event, obj)} name={this.props.filter.name} type="checkbox"/>{this.props.filter.options[i]}</label></div>)
    //   }
    // }


    

    // let select = <select onChange={this.updateSearchLogic.bind(this)}>
    //                 <option value="OR">checked ONE OR MORE of the following</option>
    //                 <option value="AND">checked ONLY the following</option>
    //                 <option value="NOT">have NOT CHECKED ANY OF the following</option>
    //             </select>

    // let display = 'none';
    // if (this.state.opened) {
    //   display = 'block'
    // }

    // let bgTest = (this.props.shouldBeDisabled[0].disabled == false) ? 'white' : '#efefef'

    return (
      <div className="filter-option" /*style={{backgroundColor:bgTest}}*/>
      <p>Filter by {this.props.filter.name}</p>
      <div /*display={display}*/>
      {/*<p>Show me people who have {select}:</p>*/}
      {elems}
      </div>
      </div>
    )

  }

}